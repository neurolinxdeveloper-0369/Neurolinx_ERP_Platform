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
import java.util.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private RecipeItemRepository recipeItemRepository;
    @Autowired private StockBatchRepository stockBatchRepository;
    @Autowired private StockMovementRepository stockMovementRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private InventoryService inventoryService;
    @Autowired private jakarta.servlet.http.HttpServletRequest request;

    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCompany() != null) return user.getCompany();
            if (user.getRole() != null && user.getRole().getCompany() != null) return user.getRole().getCompany();
        }
        return companyRepository.findAll().stream().findFirst().orElse(null);
    }

    private Long getBranchId() {
        String branchHeader = request.getHeader("X-Branch-Id");
        if (branchHeader != null && !branchHeader.equalsIgnoreCase("global") && !branchHeader.trim().isEmpty()) {
            try {
                return Long.parseLong(branchHeader);
            } catch (Exception ignored) {}
        }
        return null;
    }

    @GetMapping("/batches")
    public ResponseEntity<?> getBatches() {
        try {
            Company company = getUserCompany();
            if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
            Long branchId = getBranchId();
            if (branchId != null) {
                return ResponseEntity.ok(stockBatchRepository.findByCompanyAndBranchId(company, branchId));
            }
            return ResponseEntity.ok(stockBatchRepository.findByCompany(company));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }

    @GetMapping("/ingredients")
    public ResponseEntity<?> getIngredients() {
        try {
            Company company = getUserCompany();
            if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
            Long branchId = getBranchId();
            if (branchId != null) {
                return ResponseEntity.ok(ingredientRepository.findByCompanyAndBranchId(company, branchId));
            }
            return ResponseEntity.ok(ingredientRepository.findByCompany(company));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }

    @PostMapping("/ingredients")
    @Transactional
    public ResponseEntity<?> addIngredient(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        Ingredient ing = new Ingredient();
        ing.setCompany(company);
        ing.setName(payload.get("name").toString());
        ing.setUnit(payload.get("unit") != null ? payload.get("unit").toString() : "kg");

        if (payload.get("stockLevel") != null) {
            ing.setStockLevel(new BigDecimal(payload.get("stockLevel").toString()));
        }
        if (payload.get("reorderLevel") != null) {
            ing.setReorderLevel(new BigDecimal(payload.get("reorderLevel").toString()));
        }
        if (payload.get("costPerUnit") != null) {
            ing.setCostPerUnit(new BigDecimal(payload.get("costPerUnit").toString()));
        }

        Ingredient saved = ingredientRepository.save(ing);

        // Record initial stock movement if starting stock > 0
        if (saved.getStockLevel().compareTo(BigDecimal.ZERO) > 0) {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            inventoryService.recordMovement(
                    company,
                    null,
                    saved,
                    "INITIAL_STOCK",
                    saved.getStockLevel(),
                    BigDecimal.ZERO,
                    saved.getStockLevel(),
                    saved.getCostPerUnit(),
                    "MANUAL_ENTRY",
                    "INIT-" + saved.getId(),
                    "Initial stock recorded on ingredient creation",
                    username
            );
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/ingredients/{id}")
    @Transactional
    public ResponseEntity<?> updateIngredient(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return ingredientRepository.findById(id).map(ing -> {
            if (company != null && ing.getCompany() != null && !ing.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            }
            if (payload.containsKey("name")) ing.setName(payload.get("name").toString());
            if (payload.containsKey("unit")) ing.setUnit(payload.get("unit").toString());
            if (payload.containsKey("stockLevel")) {
                BigDecimal oldStock = ing.getStockLevel();
                BigDecimal newStock = new BigDecimal(payload.get("stockLevel").toString());
                ing.setStockLevel(newStock);

                // Record adjustment if changed directly
                if (oldStock.compareTo(newStock) != 0) {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    inventoryService.recordMovement(
                            company,
                            null,
                            ing,
                            "MANUAL_ADJUSTMENT",
                            newStock.subtract(oldStock),
                            oldStock,
                            newStock,
                            ing.getCostPerUnit(),
                            "MANUAL_UPDATE",
                            "UPD-" + ing.getId(),
                            "Direct stock update via ingredient edit",
                            username
                    );
                }
            }
            if (payload.containsKey("reorderLevel")) ing.setReorderLevel(new BigDecimal(payload.get("reorderLevel").toString()));
            if (payload.containsKey("costPerUnit")) ing.setCostPerUnit(new BigDecimal(payload.get("costPerUnit").toString()));

            return ResponseEntity.ok(ingredientRepository.save(ing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/ingredients/{id}")
    @Transactional
    public ResponseEntity<?> deleteIngredient(@PathVariable Long id) {
        ingredientRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/movements")
    public ResponseEntity<?> getStockMovements() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(stockMovementRepository.findByCompanyAndBranchIdOrderByCreatedAtDesc(company, branchId));
        }
        return ResponseEntity.ok(stockMovementRepository.findByCompanyOrderByCreatedAtDesc(company));
    }

    @GetMapping("/ingredients/{id}/movements")
    public ResponseEntity<?> getIngredientMovements(@PathVariable Long id) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return ingredientRepository.findById(id).map(ing -> {
            return ResponseEntity.ok(stockMovementRepository.findByCompanyAndIngredientOrderByCreatedAtDesc(company, ing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/adjustments")
    @Transactional
    public ResponseEntity<?> adjustStock(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (!payload.containsKey("ingredientId") || !payload.containsKey("newStock")) {
            return ResponseEntity.badRequest().body(Map.of("message", "ingredientId and newStock are required"));
        }

        Long ingId = Long.parseLong(payload.get("ingredientId").toString());
        var ingOpt = ingredientRepository.findById(ingId);
        if (ingOpt.isEmpty()) return ResponseEntity.notFound().build();

        Ingredient ing = ingOpt.get();
        BigDecimal oldStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
        BigDecimal newStock = new BigDecimal(payload.get("newStock").toString());
        BigDecimal difference = newStock.subtract(oldStock);

        String reason = payload.containsKey("reason") && payload.get("reason") != null
                ? payload.get("reason").toString()
                : "Physical stock audit adjustment";

        ing.setStockLevel(newStock);
        ingredientRepository.save(ing);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        StockMovement movement = inventoryService.recordMovement(
                company,
                null,
                ing,
                "MANUAL_ADJUSTMENT",
                difference,
                oldStock,
                newStock,
                ing.getCostPerUnit(),
                "PHYSICAL_AUDIT",
                "ADJ-" + System.currentTimeMillis(),
                reason,
                username
        );

        return ResponseEntity.ok(Map.of("message", "Stock adjusted successfully", "movement", movement));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getInventorySummary() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        List<Ingredient> ingredients = ingredientRepository.findByCompany(company);

        BigDecimal totalValuation = BigDecimal.ZERO;
        int lowStockCount = 0;
        int outOfStockCount = 0;

        for (Ingredient ing : ingredients) {
            BigDecimal stock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal cost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            totalValuation = totalValuation.add(stock.multiply(cost));

            BigDecimal reorder = ing.getReorderLevel() != null ? ing.getReorderLevel() : BigDecimal.ZERO;
            if (stock.compareTo(BigDecimal.ZERO) <= 0) {
                outOfStockCount++;
                lowStockCount++;
            } else if (stock.compareTo(reorder) <= 0) {
                lowStockCount++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "totalIngredients", ingredients.size(),
                "totalValuation", totalValuation,
                "lowStockCount", lowStockCount,
                "outOfStockCount", outOfStockCount
        ));
    }
}
