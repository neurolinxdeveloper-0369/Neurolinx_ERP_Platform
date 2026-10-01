package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private RecipeItemRepository recipeItemRepository;

    @GetMapping("/ingredients")
    public ResponseEntity<?> getIngredients() {
        return ResponseEntity.ok(ingredientRepository.findAll());
    }

    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Ingredient payload) {
        if (payload.getStockLevel() == null) payload.setStockLevel(BigDecimal.ZERO);
        return ResponseEntity.ok(ingredientRepository.save(payload));
    }

    @PutMapping("/ingredients/{id}")
    public ResponseEntity<?> updateIngredient(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ingredientRepository.findById(id).map(ing -> {
            if (payload.containsKey("name")) ing.setName(payload.get("name").toString());
            if (payload.containsKey("unit")) ing.setUnit(payload.get("unit").toString());
            if (payload.containsKey("stockLevel")) ing.setStockLevel(new BigDecimal(payload.get("stockLevel").toString()));
            return ResponseEntity.ok(ingredientRepository.save(ing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/ingredients/{id}")
    public ResponseEntity<?> deleteIngredient(@PathVariable Long id) {
        ingredientRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
