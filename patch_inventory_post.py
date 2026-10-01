import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/InventoryController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_post = """    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Ingredient payload) {
        if (payload.getStockLevel() == null) payload.setStockLevel(BigDecimal.ZERO);
        return ResponseEntity.ok(ingredientRepository.save(payload));
    }"""
new_post = """    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Map<String, Object> payload) {
        Ingredient ing = new Ingredient();
        ing.setName(payload.get("name").toString());
        ing.setUnit(payload.get("unit") != null ? payload.get("unit").toString() : "kg");
        if (payload.get("stockLevel") != null) {
            ing.setStockLevel(new BigDecimal(payload.get("stockLevel").toString()));
        }
        return ResponseEntity.ok(ingredientRepository.save(ing));
    }"""
text = text.replace(old_post, new_post)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched InventoryController")
