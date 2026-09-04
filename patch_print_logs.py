import os
import re

path = 'erp-frontend/src/context/PrinterContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('alert(`Printing failed: ${error.message}`);', 'addLog(`❌ Printing failed: ${error.message}`);\n      alert(`Printing failed: ${error.message}`);')
text = text.replace('alert("No active Bluetooth connection. Please pair a printer in the Printer Canvas first.");', 'addLog("❌ No active Bluetooth connection.");\n      alert("No active Bluetooth connection. Please pair a printer in the Printer Canvas first.");')

# Add success log if not already added
if '✅ Print job transmitted successfully!' not in text:
    text = text.replace('await new Promise(resolve => setTimeout(resolve, 50));\n      }\n    } catch', 'await new Promise(resolve => setTimeout(resolve, 50));\n      }\n      addLog("✅ Print job transmitted successfully!");\n    } catch')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PrinterContext print logging added')
