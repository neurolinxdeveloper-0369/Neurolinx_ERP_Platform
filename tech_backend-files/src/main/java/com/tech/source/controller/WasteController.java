package com.tech.source.controller;

import com.tech.source.model.*;
import com.tech.source.repository.*;
import com.tech.source.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/waste")
public class WasteController {

    @Autowired private WasteRepository wasteRepository;
    @Autowired private IngredientRepository ingredientRepository;
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

    @GetMapping
    public ResponseEntity<?> getWasteEntries(@RequestParam(required = false) String date) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        if (date != null && !date.isEmpty()) {
            return ResponseEntity.ok(wasteRepository.findByCompanyAndDateRecorded(company, LocalDate.parse(date)));
        }
        return ResponseEntity.ok(wasteRepository.findByCompany(company));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createWasteEntry(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (!payload.containsKey("ingredientId") || !payload.containsKey("quantity")) {
            return ResponseEntity.badRequest().body(Map.of("message", "ingredientId and quantity are required"));
        }

        Long ingId = Long.parseLong(payload.get("ingredientId").toString());
        Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
        if (ing == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid ingredient"));
        }

        WasteEntry waste = new WasteEntry();
        waste.setCompany(company);
        waste.setIngredient(ing);
        
        BigDecimal qty = new BigDecimal(payload.get("quantity").toString());
        waste.setQuantity(qty);

        String unit = payload.containsKey("unit") && payload.get("unit") != null
                ? payload.get("unit").toString()
                : ing.getUnit();
        waste.setUnit(unit);

        BigDecimal convertedQty = inventoryService.convertUnit(qty, unit, ing.getUnit());
        
        if (payload.containsKey("reason") && payload.get("reason") != null && !payload.get("reason").toString().isEmpty()) {
            waste.setReason(payload.get("reason").toString());
        } else {
            waste.setReason("Spoilage");
        }

        String staffName = payload.containsKey("staffName") && payload.get("staffName") != null && !payload.get("staffName").toString().isEmpty()
                ? payload.get("staffName").toString()
                : SecurityContextHolder.getContext().getAuthentication().getName();
        waste.setStaffName(staffName);

        BigDecimal costLost = BigDecimal.ZERO;
        if (payload.containsKey("costLost") && payload.get("costLost") != null && !payload.get("costLost").toString().isEmpty()) {
            costLost = new BigDecimal(payload.get("costLost").toString());
        } else {
            // Auto-calculate from ingredient costPerUnit
            BigDecimal unitCost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            costLost = unitCost.multiply(convertedQty);
        }
        waste.setCostLost(costLost);

        if (payload.containsKey("dateRecorded") && payload.get("dateRecorded") != null && !payload.get("dateRecorded").toString().isEmpty()) {
            waste.setDateRecorded(LocalDate.parse(payload.get("dateRecorded").toString()));
        } else {
            waste.setDateRecorded(LocalDate.now());
        }

        waste = wasteRepository.save(waste);

        // Deduct from global inventory
        BigDecimal currentStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
        BigDecimal newStock = currentStock.subtract(convertedQty);
        ing.setStockLevel(newStock);
        ingredientRepository.save(ing);

        // Record in auditable stock ledger
        inventoryService.recordMovement(
                company,
                null,
                ing,
                "WASTE_DEDUCTION",
                convertedQty.negate(),
                currentStock,
                newStock,
                ing.getCostPerUnit(),
                "WASTE_LOG",
                "WST-" + waste.getId(),
                waste.getReason() + " (Logged by " + staffName + ")",
                staffName
        );

        return ResponseEntity.ok(waste);
    }
}
