import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/RecipeController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("recipeItemRepository.findByDish(dish)", "recipeItemRepository.findByDishId(dish.getId())")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched RecipeController")
