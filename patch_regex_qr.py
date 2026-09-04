import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"if \(orderType === 'Dine-In'\) \{\s*payload = new Uint8Array\(\[\.\.\.payload, \.\.\.encoder\.encode\(\"\\nSCAN TO PAY \(UPI\)\\n\"\)]\);\s*// Here we just put a placeholder until image rasterizer is built\s*payload = new Uint8Array\(\[\.\.\.payload, \.\.\.encoder\.encode\(\"\[ QR CODE \]\\n\"\)]\);\s*\}",
    r"if (orderType === 'Dine-In') {\n        if (settings?.upiQrImageBase64) {\n          payload = new Uint8Array([...payload, ...encoder.encode(\"\\nSCAN TO PAY (UPI)\\n\")]);\n          const rasterData = await rasterizeImage(settings.upiQrImageBase64);\n          payload = new Uint8Array([...payload, ...rasterData]);\n        }\n      }",
    text
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Orders.tsx QR with regex')
