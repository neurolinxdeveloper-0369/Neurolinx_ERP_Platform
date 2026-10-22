package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import com.neurolinx.erp.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@RestController
@RequestMapping("/api/inventory/recipes")
public class RecipeController {

    @Autowired private DishRepository dishRepository;
    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private RecipeItemRepository recipeItemRepository;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;
    @Autowired private InventoryService inventoryService;

    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCompany() != null) return user.getCompany();
            if (user.getRole() != null && user.getRole().getCompany() != null) return user.getRole().getCompany();
        }
        return companyRepo.findAll().stream().findFirst().orElse(null);
    }

    @GetMapping("/{dishId}")
    public ResponseEntity<?> getRecipeForDish(@PathVariable Long dishId) {
        Company company = getUserCompany();
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null || (company != null && dish.getCompany() != null && !dish.getCompany().getId().equals(company.getId()))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dish not found"));
        }
        return ResponseEntity.ok(recipeItemRepository.findByDishId(dish.getId()));
    }

    @PostMapping("/{dishId}")
    @Transactional
    public ResponseEntity<?> saveRecipeForDish(@PathVariable Long dishId, @RequestBody List<Map<String, Object>> payload) {
        Company company = getUserCompany();
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null || (company != null && dish.getCompany() != null && !dish.getCompany().getId().equals(company.getId()))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dish not found"));
        }

        // Delete old recipe items
        List<RecipeItem> oldItems = recipeItemRepository.findByDishId(dish.getId());
        recipeItemRepository.deleteAll(oldItems);

        List<RecipeItem> newItems = new ArrayList<>();
        for (Map<String, Object> itemData : payload) {
            Long ingId = Long.parseLong(itemData.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
            if (ing != null) {
                RecipeItem ri = new RecipeItem();
                ri.setDish(dish);
                ri.setIngredient(ing);
                ri.setQuantityRequired(new BigDecimal(itemData.get("quantityRequired").toString()));
                String unit = itemData.containsKey("unit") && itemData.get("unit") != null
                        ? itemData.get("unit").toString()
                        : ing.getUnit();
                ri.setUnit(unit);
                newItems.add(recipeItemRepository.save(ri));
            }
        }

        return ResponseEntity.ok(newItems);
    }

    @GetMapping("/dish-cost-summary")
    public ResponseEntity<?> getDishCostSummary() {
        try {
            Company company = getUserCompany();
            if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

            List<Dish> dishes = dishRepository.findByCompany(company);
            List<Map<String, Object>> summaries = new ArrayList<>();

            for (Dish dish : dishes) {
                List<RecipeItem> items = recipeItemRepository.findByDishId(dish.getId());
                BigDecimal recipeCost = BigDecimal.ZERO;
                boolean hasRecipe = !items.isEmpty();
                int maxServingsPossible = hasRecipe ? Integer.MAX_VALUE : 0;
                boolean isOutOfStock = false;

                for (RecipeItem item : items) {
                    Ingredient ing = item.getIngredient();
                    if (ing != null) {
                        BigDecimal convertedQty = inventoryService.convertUnit(item.getQuantityRequired(), item.getUnit(), ing.getUnit());
                        BigDecimal ingCost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
                        recipeCost = recipeCost.add(convertedQty.multiply(ingCost));

                        BigDecimal currentStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                        if (convertedQty.compareTo(BigDecimal.ZERO) > 0) {
                            int servingsForThisIng = currentStock.divide(convertedQty, 0, RoundingMode.FLOOR).intValue();
                            if (servingsForThisIng < maxServingsPossible) {
                                maxServingsPossible = Math.max(0, servingsForThisIng);
                            }
                            if (servingsForThisIng <= 0) {
                                isOutOfStock = true;
                            }
                        }
                    }
                }

                if (!hasRecipe || maxServingsPossible == Integer.MAX_VALUE) {
                    maxServingsPossible = 0;
                }

                BigDecimal price = dish.getPrice() != null ? dish.getPrice() : BigDecimal.ZERO;
                BigDecimal margin = price.subtract(recipeCost);
                BigDecimal marginPercent = BigDecimal.ZERO;
                if (price.compareTo(BigDecimal.ZERO) > 0) {
                    marginPercent = margin.divide(price, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                }

                String stockStatus;
                if (!hasRecipe) {
                    stockStatus = "No Recipe";
                } else if (isOutOfStock || maxServingsPossible <= 0) {
                    stockStatus = "Out of Stock";
                } else if (maxServingsPossible <= 5) {
                    stockStatus = "Low Stock";
                } else {
                    stockStatus = "In Stock";
                }

                Map<String, Object> map = new HashMap<>();
                map.put("dishId", dish.getId());
                map.put("dishName", dish.getName());
                map.put("price", price);
                map.put("categoryName", dish.getCategory() != null ? dish.getCategory().getName() : "Uncategorized");
                map.put("hasRecipe", hasRecipe);
                map.put("recipeCost", recipeCost);
                map.put("grossMargin", margin);
                map.put("grossMarginPercent", marginPercent);
                map.put("servingsAvailable", maxServingsPossible);
                map.put("stockStatus", stockStatus);
                map.put("itemCount", items.size());

                summaries.add(map);
            }

            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
}
