import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add dependencies
deps_old = """    @Autowired private CompanyRepository companyRepo;"""
deps_new = """    @Autowired private CompanyRepository companyRepo;
    @Autowired private RecipeItemRepository recipeItemRepo;
    @Autowired private IngredientRepository ingredientRepo;"""
text = text.replace(deps_old, deps_new)

# Add deduction logic
save_old = """        order = orderRepo.save(order);
        
        return ResponseEntity.ok(order);"""
save_new = """        order = orderRepo.save(order);

        // Auto-deduct inventory based on Recipe
        try {
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getDish() != null) {
                        List<RecipeItem> recipes = recipeItemRepo.findByDishId(item.getDish().getId());
                        int qtyOrdered = item.getQuantity() != null ? item.getQuantity() : 1;
                        for (RecipeItem r : recipes) {
                            if (r.getIngredient() != null && r.getQuantityRequired() != null) {
                                BigDecimal totalNeeded = r.getQuantityRequired().multiply(new BigDecimal(qtyOrdered));
                                Ingredient ing = r.getIngredient();
                                if (ing.getStockLevel() != null) {
                                    ing.setStockLevel(ing.getStockLevel().subtract(totalNeeded));
                                    ingredientRepo.save(ing);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(order);"""
text = text.replace(save_old, save_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController for auto-deduction")
