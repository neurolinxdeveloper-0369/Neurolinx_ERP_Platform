import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

raster_func = """
  const rasterizeImage = async (base64Str: string): Promise<Uint8Array> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(new Uint8Array(0)); return; }
        
        let width = img.width;
        let height = img.height;
        if (width > 200) {
          height = Math.floor(height * (200 / width));
          width = 200;
        }
        width = Math.floor(width / 8) * 8; 
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        
        const xL = (width / 8) % 256;
        const xH = Math.floor((width / 8) / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);
        
        const dataLength = (width / 8) * height;
        const buffer = new Uint8Array(8 + dataLength);
        
        buffer[0] = 0x1d; buffer[1] = 0x76; buffer[2] = 0x30; buffer[3] = 0x00;
        buffer[4] = xL; buffer[5] = xH; buffer[6] = yL; buffer[7] = yH;
        
        let offset = 8;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x += 8) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              const idx = (y * width + (x + bit)) * 4;
              const brightness = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
              if (brightness < 128) {
                b |= (1 << (7 - bit));
              }
            }
            buffer[offset++] = b;
          }
        }
        resolve(buffer);
      };
      img.onerror = () => resolve(new Uint8Array(0));
      img.src = base64Str;
    });
  };

  const generateCustomerReceipt = async (orderNumber: string, total: number, tax: number) => {
"""

text = text.replace('const generateCustomerReceipt = (orderNumber: string, total: number, tax: number) => {', raster_func)

old_qr = """      if (orderType === 'Dine-In') {
          payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
          // Here we just put a placeholder until image rasterizer is built
          payload = new Uint8Array([...payload, ...encoder.encode("[ QR CODE ]\\n")]); 
      }"""
new_qr = """      if (orderType === 'Dine-In' && settings?.upiQrImageBase64) {
          payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
          const rasterData = await rasterizeImage(settings.upiQrImageBase64);
          payload = new Uint8Array([...payload, ...rasterData]); 
      }"""
text = text.replace(old_qr, new_qr)

old_call = """              setTimeout(() => {
                sendEscPos(generateCustomerReceipt(order.orderNumber, finalTotal, tax));
              }, 3000); // 3 second delay to let KOT finish cutting"""
new_call = """              setTimeout(async () => {
                const billPayload = await generateCustomerReceipt(order.orderNumber, finalTotal, tax);
                sendEscPos(billPayload);
              }, 3000); // 3 second delay to let KOT finish cutting"""
text = text.replace(old_call, new_call)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Orders.tsx patched for QR rasterization')
