import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

endpoints = """
    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return categoryRepo.findById(id).map(cat -> {
            if (!cat.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("name")) cat.setName((String) payload.get("name"));
            return ResponseEntity.ok(categoryRepo.save(cat));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        Company company = getUserCompany();
        return categoryRepo.findById(id).map(cat -> {
            if (!cat.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            categoryRepo.delete(cat);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/dishes/{id}")
    public ResponseEntity<?> updateDish(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return dishRepo.findById(id).map(dish -> {
            if (!dish.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("name")) dish.setName((String) payload.get("name"));
            if (payload.containsKey("price")) dish.setPrice(new BigDecimal(payload.get("price").toString()));
            if (payload.containsKey("categoryId")) {
                Long catId = Long.parseLong(payload.get("categoryId").toString());
                dish.setCategory(categoryRepo.findById(catId).orElse(null));
            }
            if (payload.containsKey("imageBase64")) dish.setImageBase64((String) payload.get("imageBase64"));
            if (payload.containsKey("isTodaysSpecial")) dish.setIsTodaysSpecial((Boolean) payload.get("isTodaysSpecial"));
            if (payload.containsKey("discountPercentage")) dish.setDiscountPercentage(new BigDecimal(payload.get("discountPercentage").toString()));
            return ResponseEntity.ok(dishRepo.save(dish));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/dishes/{id}")
    public ResponseEntity<?> deleteDish(@PathVariable Long id) {
        Company company = getUserCompany();
        return dishRepo.findById(id).map(dish -> {
            if (!dish.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            dishRepo.delete(dish);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }
"""

if "@PutMapping(\"/categories/{id}\")" not in text:
    # insert before the end of the class
    idx = text.rfind('}')
    text = text[:idx] + endpoints + text[idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Added endpoints")
else:
    print("Already added")
