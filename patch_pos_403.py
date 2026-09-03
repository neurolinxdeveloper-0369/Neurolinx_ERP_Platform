import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'return ResponseEntity.status(403).body("Company not found");', 
    'return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated 403 message in PosController')
