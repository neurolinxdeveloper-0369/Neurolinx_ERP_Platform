import os
import re

path = 'erp-frontend/src/context/PrinterContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add logs to context type
text = text.replace('isConnecting: boolean;', 'isConnecting: boolean;\n  logs: string[];\n  clearLogs: () => void;')

# Add state to provider
provider_start = 'export function PrinterProvider({ children }: { children: ReactNode }) {\n'
provider_new = provider_start + '  const [logs, setLogs] = useState<string[]>([]);\n  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);\n  const clearLogs = () => setLogs([]);\n'
text = text.replace(provider_start, provider_new)

# Add logs to the returned provider value
text = text.replace('connectBluetoothPrinter, sendEscPos, disconnect }}', 'connectBluetoothPrinter, sendEscPos, disconnect, logs, clearLogs }}')

# Add addLog calls inside connectBluetoothPrinter
text = text.replace('setIsConnecting(true);', 'setIsConnecting(true);\n      addLog("Requesting Bluetooth Device...");')
text = text.replace('const server = await device.gatt.connect();', 'addLog(`Selected device: ${device.name}`);\n      const server = await device.gatt.connect();\n      addLog("GATT Server connected. Discovering services...");')
text = text.replace('const services = await server.getPrimaryServices();', 'const services = await server.getPrimaryServices();\n      addLog(`Found ${services.length} services.`);')
text = text.replace('characteristicFound = characteristic;\n            break;', 'addLog(`Found writable characteristic: ${characteristic.uuid}`);\n            characteristicFound = characteristic;\n            break;')
text = text.replace('setConnectedCharacteristic(characteristicFound);', 'setConnectedCharacteristic(characteristicFound);\n        addLog("✅ Printer successfully connected and ready to print!");')
text = text.replace('throw new Error("Could not find a writable characteristic.");', 'addLog("❌ Error: Could not find a writable characteristic.");\n        throw new Error("Could not find a writable characteristic.");')
text = text.replace('throw error;', 'addLog(`❌ Connection failed: ${error.message}`);\n      throw error;')

# Add to disconnect
text = text.replace('setConnectedDevice(null);', 'addLog("Printer disconnected.");\n    setConnectedDevice(null);')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PrinterContext logs added')
