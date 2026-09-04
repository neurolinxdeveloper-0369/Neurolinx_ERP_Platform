import os

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

idx_start = text.find("if (orderType === 'Dine-In') {")
idx_end = text.find("if (settings?.receiptFooter)", idx_start)

new_qr = """if (orderType === 'Dine-In') {
        if (settings?.upiQrImageBase64) {
          payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
          const rasterData = await rasterizeImage(settings.upiQrImageBase64);
          payload = new Uint8Array([...payload, ...rasterData]); 
        }
      }
      
      """

text = text[:idx_start] + new_qr + text[idx_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Orders.tsx QR safely')
