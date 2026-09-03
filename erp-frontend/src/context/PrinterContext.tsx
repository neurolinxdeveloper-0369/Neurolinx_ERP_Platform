import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface PrinterContextType {
  connectedDevice: any;
  connectedCharacteristic: any;
  isConnecting: boolean;
  connectBluetoothPrinter: () => Promise<void>;
  sendEscPos: (payload: Uint8Array) => Promise<void>;
  disconnect: () => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [connectedCharacteristic, setConnectedCharacteristic] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBluetoothPrinter = async () => {
    try {
      setIsConnecting(true);
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      let characteristicFound = null;
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            characteristicFound = characteristic;
            break;
          }
        }
        if (characteristicFound) break;
      }

      if (characteristicFound) {
        setConnectedDevice(device);
        setConnectedCharacteristic(characteristicFound);
        
        device.addEventListener('gattserverdisconnected', () => {
          console.warn("Printer disconnected. Attempting to auto-reconnect...");
          setTimeout(async () => {
             try {
               await device.gatt.connect();
               console.log("Auto-reconnected successfully.");
             } catch (e) {
               console.error("Auto-reconnect failed.", e);
               setConnectedDevice(null);
               setConnectedCharacteristic(null);
             }
          }, 2000);
        });
        
        alert(`Successfully connected to ${device.name}!`);
      } else {
        alert("Error: Could not find a writable characteristic.");
        server.disconnect();
      }
    } catch (error: any) {
      alert(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const sendEscPos = async (payload: Uint8Array) => {
    if (!connectedCharacteristic) {
      alert("No active Bluetooth connection. Please pair a printer in the Printer Canvas first.");
      return;
    }
    try {
      const chunkSize = 512;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await connectedCharacteristic.writeValue(chunk);
      }
    } catch (error: any) {
      alert(`Printing failed: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (connectedDevice && connectedDevice.gatt.connected) {
      connectedDevice.gatt.disconnect();
    }
    setConnectedDevice(null);
    setConnectedCharacteristic(null);
  };

  return (
    <PrinterContext.Provider value={{ connectedDevice, connectedCharacteristic, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect }}>
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
