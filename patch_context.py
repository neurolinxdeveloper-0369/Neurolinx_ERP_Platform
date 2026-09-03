import os
import re

path = 'erp-frontend/src/context/PrinterContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Change return type
text = text.replace('connectBluetoothPrinter: () => Promise<void>;', 'connectBluetoothPrinter: () => Promise<any>;')

# Change function signature
text = text.replace('const connectBluetoothPrinter = async () => {', 'const connectBluetoothPrinter = async (): Promise<any> => {')

# Remove alerts
text = text.replace('alert(`Successfully connected to ${device.name}!`);', 'return device;')
text = text.replace('alert("Error: Could not find a writable characteristic.");', 'throw new Error("Could not find a writable characteristic.");')
text = text.replace('alert(`Connection failed: ${error.message}`);', 'throw error;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PrinterContext updated')
