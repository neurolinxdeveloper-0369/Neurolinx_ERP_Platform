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

        @Autowired private com.neurolinx.erp.repository.StockBatchRepository stockBatchRepository;
    @Autowired private com.neurolinx.erp.repository.UserRepository userRepository;
    @Autowired private jakarta.servlet.http.HttpServletRequest request;

    private com.neurolinx.erp.model.Company getUserCompany() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(com.neurolinx.erp.model.User::getCompany).orElseThrow();
    }

    @GetMapping("/batches")
    public org.springframework.http.ResponseEntity<?> getBatches() {
        com.neurolinx.erp.model.Company company = getUserCompany();
        String branchHeader = request.getHeader("X-Branch-Id");
        if (branchHeader != null && !branchHeader.equals("global")) {
            return org.springframework.http.ResponseEntity.ok(stockBatchRepository.findByCompanyAndBranchId(company, Long.parseLong(branchHeader)));
        }
        return org.springframework.http.ResponseEntity.ok(stockBatchRepository.findByCompany(company));
    }

    @GetMapping("/ingredients")
    public ResponseEntity<?> getIngredients() {
        com.neurolinx.erp.model.Company company = getUserCompany();
        String branchHeader = request.getHeader("X-Branch-Id");
        if (branchHeader != null && !branchHeader.equals("global")) {
            return ResponseEntity.ok(ingredientRepository.findByCompanyAndBranchId(company, Long.parseLong(branchHeader)));
        }
        return ResponseEntity.ok(ingredientRepository.findByCompany(company));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Map<String, Object> payload) {
        Ingredient ing = new Ingredient();
        ing.setCompany(getUserCompany());
        ing.setName(payload.get("name").toString());
        ing.setUnit(payload.get("unit") != null ? payload.get("unit").toString() : "kg");
        if (payload.get("stockLevel") != null) {
            ing.setStockLevel(new BigDecimal(payload.get("stockLevel").toString()));
        }
        return ResponseEntity.ok(ingredientRepository.save(ing));
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
