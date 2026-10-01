package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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
    @org.springframework.transaction.annotation.Transactional
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
        
        if (payload.containsKey("reason")) waste.setReason(payload.get("reason").toString());
        else waste.setReason("Spoilage");

        if (payload.containsKey("costLost")) {
            waste.setCostLost(new BigDecimal(payload.get("costLost").toString()));
        }

        if (payload.containsKey("dateRecorded") && payload.get("dateRecorded") != null) {
            waste.setDateRecorded(LocalDate.parse(payload.get("dateRecorded").toString()));
        } else {
            waste.setDateRecorded(LocalDate.now());
        }

        wasteRepository.save(waste);

        // Deduct from global inventory
        if (ing.getStockLevel() != null) {
            ing.setStockLevel(ing.getStockLevel().subtract(qty));
            ingredientRepository.save(ing);
        }

        return ResponseEntity.ok(waste);
    }
}
