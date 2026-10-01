package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory/recipes")
public class RecipeController {

    @Autowired private DishRepository dishRepository;
    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private RecipeItemRepository recipeItemRepository;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;

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
        if (dish == null || !dish.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dish not found"));
        }
        return ResponseEntity.ok(recipeItemRepository.findByDishId(dish.getId()));
    }

    @PostMapping("/{dishId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> saveRecipeForDish(@PathVariable Long dishId, @RequestBody List<Map<String, Object>> payload) {
        Company company = getUserCompany();
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null || !dish.getCompany().getId().equals(company.getId())) {
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
                newItems.add(recipeItemRepository.save(ri));
            }
        }

        return ResponseEntity.ok(newItems);
    }
}
