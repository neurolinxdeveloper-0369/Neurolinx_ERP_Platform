import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/InventoryController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_endpoint = """    @Autowired private StockBatchRepository stockBatchRepo;

    @GetMapping("/batches")
    public ResponseEntity<?> getBatches() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(stockBatchRepo.findByCompany(company));
    }
"""
text = text.replace("    @Autowired private IngredientRepository ingredientRepo;", "    @Autowired private IngredientRepository ingredientRepo;\n" + new_endpoint)
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched InventoryController to return batches")
