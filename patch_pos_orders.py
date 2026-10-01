import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_endpoint = """    @GetMapping("/orders/all")
    public ResponseEntity<?> getAllOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));
        return ResponseEntity.ok(orderRepo.findByCompany(company));
    }
"""

text = text.replace("    @GetMapping(\"/orders/recent\")", new_endpoint + "\n    @GetMapping(\"/orders/recent\")")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController with /orders/all using findByCompany")
