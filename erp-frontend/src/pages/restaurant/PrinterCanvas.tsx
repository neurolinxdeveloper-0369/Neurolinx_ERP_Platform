import { useState } from 'react';
import * as Icons from 'lucide-react';

export default function PrinterCanvas() {
  const [printerDevice, setPrinterDevice] = useState<any>(null);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const connectBluetoothPrinter = async () => {
    try {
      setIsConnecting(true);
      addLog("Requesting Bluetooth Device (Make sure HOP-E200 is paired to your OS)...");
      
      // Request any bluetooth device to allow user to pick their printer
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Common printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // BLE Serial
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Another common serial
        ]
      });

      addLog(`Selected device: ${device.name}`);
      
      const server = await device.gatt.connect();
      addLog("GATT Server connected. Discovering services...");

      const services = await server.getPrimaryServices();
      addLog(`Found ${services.length} services.`);

      let characteristicFound = null;

      for (const service of services) {
        addLog(`Scanning Service: ${service.uuid}`);
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          addLog(`  -> Characteristic: ${characteristic.uuid} (Write: ${characteristic.properties.write})`);
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            characteristicFound = characteristic;
            break;
          }
        }
        if (characteristicFound) break;
      }

      if (characteristicFound) {
        setPrinterDevice(device);
        setPrinterCharacteristic(characteristicFound);
        addLog("✅ Printer successfully connected and ready to print!");
        
        device.addEventListener('gattserverdisconnected', () => {
          addLog("❌ Printer disconnected.");
          setPrinterDevice(null);
          setPrinterCharacteristic(null);
        });
      } else {
        addLog("❌ Error: Could not find a writable characteristic on this device. Ensure it supports BLE.");
        server.disconnect();
      }
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const printSampleReceipt = async () => {
    if (!printerCharacteristic) {
      addLog("No printer connected!");
      return;
    }

    try {
      addLog("Sending ESC/POS payload to printer...");
      
      // Standard ESC/POS commands
      const ESC = 0x1b;
      const GS = 0x1d;
      
      // Build the buffer
      const encoder = new TextEncoder();
      
      let payload = new Uint8Array([
        ESC, 0x40, // Initialize printer
        ESC, 0x61, 0x01, // Center align
        ...encoder.encode("NEUROLINX POS\n"),
        ...encoder.encode("Test Receipt\n"),
        ESC, 0x61, 0x00, // Left align
        ...encoder.encode("--------------------------------\n"),
        ...encoder.encode("1x Butter Chicken       Rs. 220\n"),
        ...encoder.encode("1x Roti                 Rs. 10\n"),
        ...encoder.encode("--------------------------------\n"),
        ESC, 0x61, 0x02, // Right align
        ...encoder.encode("TOTAL: Rs. 230\n"),
        ESC, 0x61, 0x00, // Left align
        ...encoder.encode("\n\nThank you!\n\n\n\n"), // Feed lines
        GS, 0x56, 0x41, 0x00 // Partial cut paper (if supported)
      ]);

      // Split payload into 512-byte chunks (BLE MTU limits)
      const chunkSize = 512;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await printerCharacteristic.writeValue(chunk);
      }
      
      addLog("✅ Print job completed!");
    } catch (error: any) {
      addLog(`❌ Printing failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>Printer Canvas</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Configure and test your thermal ESC/POS printers (e.g., HOP-E200) via Web Bluetooth.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Connection Panel */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Icons.Bluetooth size={24} color="#0284c7" />
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Bluetooth Printer</h2>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#334155' }}>Status: {printerDevice ? <span style={{ color: '#16a34a' }}>Connected ({printerDevice.name})</span> : <span style={{ color: '#ef4444' }}>Disconnected</span>}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Make sure your HOP-E200 printer is turned on and paired with your PC/Tablet operating system before connecting.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={connectBluetoothPrinter}
              disabled={isConnecting || printerDevice !== null}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: printerDevice ? '#e2e8f0' : '#0284c7', color: printerDevice ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: printerDevice ? 'not-allowed' : 'pointer' }}>
              {isConnecting ? 'Scanning...' : 'Pair Printer'}
            </button>
            <button 
              onClick={printSampleReceipt}
              disabled={!printerDevice}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: !printerDevice ? '#e2e8f0' : '#16a34a', color: !printerDevice ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: !printerDevice ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Icons.Printer size={18} /> Test Print
            </button>
          </div>
        </div>

        {/* Logs Panel */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <Icons.Terminal size={18} /> Diagnostic Logs
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {logs.length === 0 && <span style={{ color: '#475569' }}>Awaiting connection...</span>}
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#22c55e' : '#cbd5e1' }}>{log}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
