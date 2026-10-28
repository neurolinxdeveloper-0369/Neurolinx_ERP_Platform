import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface PrinterContextType {
  connectedDevice: any;
  connectedCharacteristic: any;
  isConnecting: boolean;
  connectionType: 'BLUETOOTH' | 'SERIAL' | null;
  logs: string[];
  clearLogs: () => void;
  connectBluetoothPrinter: () => Promise<any>;
  connectSerialPrinter: () => Promise<any>;
  sendEscPos: (payload: Uint8Array) => Promise<void>;
  disconnect: () => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const clearLogs = () => setLogs([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [connectedCharacteristic, setConnectedCharacteristic] = useState<any>(null);
  const [serialPort, setSerialPort] = useState<any>(null);
  const [connectionType, setConnectionType] = useState<'BLUETOOTH' | 'SERIAL' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Broad list of known BLE thermal receipt printer service UUIDs
  const PRINTER_BLE_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS print
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 BLE (most common 58mm/80mm mini printers)
    '0000ff00-0000-1000-8000-00805f9b34fb', // FF00 common Chinese thermal printers
    '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent/WeChat IoT POS
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Microchip Transparent UART
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART Service (NUS)
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART v2
    '0000ae00-0000-1000-8000-00805f9b34fb', // AE00
    '0000af00-0000-1000-8000-00805f9b34fb', // AF00
    '0000fff0-0000-1000-8000-00805f9b34fb', // FFF0
    '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
    '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
    '0000180a-0000-1000-8000-00805f9b34fb'  // Device Info
  ];

  const connectBluetoothPrinter = async (): Promise<any> => {
    try {
      if (!('bluetooth' in navigator)) {
        alert("Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge on HTTPS or localhost.");
        return;
      }
      setIsConnecting(true);
      addLog("Requesting Bluetooth (BLE) Device...");
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_BLE_SERVICES
      });

      addLog(`Selected device: ${device.name}`);
      
      let server;
      let services;
      let retries = 3;
      
      while (retries > 0) {
        try {
          server = await device.gatt.connect();
          addLog("GATT Server connected. Stabilizing connection...");
          
          // CRITICAL: Many thermal printers drop GATT if queried immediately. Wait 1500ms.
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          addLog("Discovering services...");
          services = await server.getPrimaryServices();
          addLog(`Found ${services.length} services.`);
          break;
        } catch (e: any) {
          retries--;
          addLog(`GATT dropped during discovery. Retrying... (${retries} left)`);
          if (retries === 0) throw e;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      let characteristicFound = null;
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            addLog(`Found writable characteristic: ${characteristic.uuid}`);
            characteristicFound = characteristic;
            break;
          }
        }
        if (characteristicFound) break;
      }

      if (characteristicFound) {
        setConnectedDevice(device);
        setConnectedCharacteristic(characteristicFound);
        setConnectionType('BLUETOOTH');
        addLog("✅ Printer successfully connected and ready to print!");
        
        device.addEventListener('gattserverdisconnected', () => {
          console.warn("Printer disconnected. Attempting robust auto-reconnect...");
          
          let attempts = 0;
          const tryReconnect = async () => {
            attempts++;
            if (attempts > 10) {
                addLog("Printer disconnected.");
                setConnectedDevice(null);
                setConnectedCharacteristic(null);
                setConnectionType(null);
                alert("Printer disconnected and could not automatically reconnect. Please try pairing again.");
                return;
            }
            
            try {
                console.log(`Auto-reconnect attempt ${attempts}...`);
                await device.gatt.connect();
                console.log("Auto-reconnected successfully.");
            } catch (e) {
                console.error("Auto-reconnect failed.", e);
                setTimeout(tryReconnect, 3000);
            }
          };
          
          setTimeout(tryReconnect, 2000);
        });
        
        return device;
      } else {
        addLog("❌ Error: Could not find a writable characteristic.");
        throw new Error("Could not find a writable characteristic.");
        server.disconnect();
      }
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSerialPrinter = async (): Promise<any> => {
    try {
      if (!('serial' in navigator)) {
        alert("Web Serial is not supported in this browser. Please use Google Chrome or Microsoft Edge on a PC/Mac.");
        return;
      }
      setIsConnecting(true);
      addLog("Requesting USB / Bluetooth Virtual COM port...");
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setConnectedDevice({ name: "USB / Bluetooth COM Printer" });
      setConnectionType('SERIAL');
      addLog("✅ USB / Serial Printer connected and ready to print!");
      return port;
    } catch (e: any) {
      addLog(`❌ Serial connection failed: ${e.message}`);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  };

  const sendEscPos = async (payload: Uint8Array) => {
    if (connectionType === 'SERIAL' && serialPort && serialPort.writable) {
      try {
        const writer = serialPort.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();
        addLog("✅ Print job transmitted successfully via USB / Serial!");
        return;
      } catch (error: any) {
        addLog(`❌ Serial printing failed: ${error.message}`);
        alert(`Serial printing failed: ${error.message}`);
        return;
      }
    }

    if (!connectedCharacteristic) {
      addLog("❌ No active Bluetooth or Serial connection.");
      alert("No active printer connection. Please pair a printer in the Printer Canvas first.");
      return;
    }
    try {
      const chunkSize = 20; // Absolute safest BLE 4.0 MTU limit
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        if (connectedCharacteristic.properties.writeWithoutResponse) {
          await connectedCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await connectedCharacteristic.writeValue(chunk);
        }
        // Add a tiny delay to prevent overwhelming the printer buffer
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      addLog("✅ Print job transmitted successfully via Bluetooth!");
    } catch (error: any) {
      addLog(`❌ Printing failed: ${error.message}`);
      alert(`Printing failed: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (connectedDevice && connectedDevice.gatt && connectedDevice.gatt.connected) {
      connectedDevice.gatt.disconnect();
    }
    if (serialPort) {
      try {
        serialPort.close();
      } catch (e) {}
      setSerialPort(null);
    }
    addLog("Printer disconnected.");
    setConnectedDevice(null);
    setConnectedCharacteristic(null);
    setConnectionType(null);
  };

  return (
    <PrinterContext.Provider value={{ connectedDevice, connectedCharacteristic, isConnecting, connectionType, connectBluetoothPrinter, connectSerialPrinter, sendEscPos, disconnect, logs, clearLogs }}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}
