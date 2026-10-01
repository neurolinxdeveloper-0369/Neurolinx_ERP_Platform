import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix createDish NPE
old_create = """        Long catId = Long.parseLong(payload.get("categoryId").toString());
        dish.setCategory(categoryRepo.findById(catId).orElse(null));"""
new_create = """        if (payload.containsKey("categoryId") && payload.get("categoryId") != null) {
            try {
                Long catId = Long.parseLong(payload.get("categoryId").toString());
                dish.setCategory(categoryRepo.findById(catId).orElse(null));
            } catch (Exception e) {}
        }"""
text = text.replace(old_create, new_create)

# Fix updateDish NPE
old_update = """            if (payload.containsKey("categoryId")) {
                Long catId = Long.parseLong(payload.get("categoryId").toString());
                dish.setCategory(categoryRepo.findById(catId).orElse(null));
            }"""
new_update = """            if (payload.containsKey("categoryId") && payload.get("categoryId") != null) {
                try {
                    Long catId = Long.parseLong(payload.get("categoryId").toString());
                    dish.setCategory(categoryRepo.findById(catId).orElse(null));
                } catch (Exception e) {}
            }"""
text = text.replace(old_update, new_update)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController NPEs")
