import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"setTimeout\(\(\) => \{\s*sendEscPos\(generateCustomerReceipt\((.*?)\)\);\s*\}, 3000\);",
    r"setTimeout(async () => {\n            const billPayload = await generateCustomerReceipt(\1);\n            sendEscPos(billPayload);\n          }, 3000);",
    text
)

# And fix 'rasterizeImage' is declared but its value is never read in both files
# The TS compiler complains because maybe generateCustomerReceipt is not calling it?
# Wait! I patched new_qr:
#       if (orderType === 'Dine-In' && settings?.upiQrImageBase64) {
#           payload = new Uint8Array([...payload, ...encoder.encode("\\nSCAN TO PAY (UPI)\\n")]);
#           const rasterData = await rasterizeImage(settings.upiQrImageBase64);
#           payload = new Uint8Array([...payload, ...rasterData]); 
#       }
# Is settings?.upiQrImageBase64 correctly spelled? Yes.

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Orders.tsx')
