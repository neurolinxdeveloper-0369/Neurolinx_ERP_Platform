import os
import re

path = 'erp-frontend/src/context/PrinterContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the connection and service discovery with a robust retry loop
old_code = """      addLog(`Selected device: ${device.name}`);
      const server = await device.gatt.connect();
      addLog("GATT Server connected. Discovering services...");
      const services = await server.getPrimaryServices();
      addLog(`Found ${services.length} services.`);"""

new_code = """      addLog(`Selected device: ${device.name}`);
      
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
      }"""

text = text.replace(old_code, new_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("PrinterContext updated with GATT robust retry")
