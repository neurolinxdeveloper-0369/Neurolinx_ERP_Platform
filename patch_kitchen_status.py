import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_endpoint = """    @PutMapping("/orders/{id}/kitchen-status")
    public ResponseEntity<?> updateKitchenStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("kitchenStatus")) {
                order.setKitchenStatus(payload.get("kitchenStatus").toString());
            }
            return ResponseEntity.ok(orderRepo.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }
"""

text = text.replace("    @GetMapping(\"/orders/recent\")", new_endpoint + "\n    @GetMapping(\"/orders/recent\")")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController with kitchen status update")
