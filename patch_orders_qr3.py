import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_qr = """      if (orderType === 'Dine-In') {
          payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
          // Here we just put a placeholder until image rasterizer is built
          payload = new Uint8Array([...payload, ...encoder.encode("[ QR CODE ]\\n")]); 
      }"""
new_qr = """      if (orderType === 'Dine-In') {
          if (settings?.upiQrImageBase64) {
              payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
              const rasterData = await rasterizeImage(settings.upiQrImageBase64);
              payload = new Uint8Array([...payload, ...rasterData]); 
          }
      }"""
text = text.replace(old_qr, new_qr)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Orders.tsx QR')
