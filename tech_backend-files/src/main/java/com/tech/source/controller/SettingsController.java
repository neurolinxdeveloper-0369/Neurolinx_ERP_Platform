package com.tech.source.controller;

import com.tech.source.model.*;
import com.tech.source.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    @Autowired private RestaurantSettingsRepository settingsRepo;
    @Autowired private RestaurantPrinterRepository printerRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;
    
    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCompany() != null) {
                return user.getCompany();
            }
            if (user.getRole() != null && user.getRole().getCompany() != null) {
                return user.getRole().getCompany();
            }
        }
        return companyRepo.findAll().stream().findFirst().orElse(null);
    }

    @GetMapping("/my-company")
    public ResponseEntity<?> getMyCompany() {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(404).body(Map.of("message", "No company found"));
        return ResponseEntity.ok(c);
    }

    @PutMapping("/my-company")
    public ResponseEntity<?> updateMyCompany(@RequestBody Company updatedCompany) {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(400).body(Map.of("message", "No company found to update"));
        
        c.setName(updatedCompany.getName());
        c.setContactNumber(updatedCompany.getContactNumber());
        c.setAddress(updatedCompany.getAddress());
        c.setWebsiteUrl(updatedCompany.getWebsiteUrl());
        c.setGstin(updatedCompany.getGstin());
        c.setPanNumber(updatedCompany.getPanNumber());
        c.setRegistrationNumber(updatedCompany.getRegistrationNumber());
        c.setFoodLicense(updatedCompany.getFoodLicense());
        c.setTotalTables(updatedCompany.getTotalTables());
        c.setTotalFloors(updatedCompany.getTotalFloors());
        c.setOperatingHours(updatedCompany.getOperatingHours());
        c.setServiceModel(updatedCompany.getServiceModel());
        c.setKitchenSetup(updatedCompany.getKitchenSetup());
        
        return ResponseEntity.ok(companyRepo.save(c));
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        Company c = getUserCompany();
        if (c == null) {
            RestaurantSettings defaultSettings = new RestaurantSettings();
            defaultSettings.setStoreName("Neurolinx POS");
            return ResponseEntity.ok(defaultSettings);
        }
        RestaurantSettings s = settingsRepo.findByCompany(c).orElseGet(() -> {
            RestaurantSettings ns = new RestaurantSettings();
            ns.setCompany(c);
            ns.setStoreName(c.getName() != null ? c.getName() : "Neurolinx POS");
            return settingsRepo.save(ns);
        });
        return ResponseEntity.ok(s);
    }
    
    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, Object> payload) {
        Company c = getUserCompany();
        if (c == null) {
            c = companyRepo.findAll().stream().findFirst().orElse(null);
        }
        if (c == null) return ResponseEntity.badRequest().body(Map.of("message", "No company found"));
        RestaurantSettings s = settingsRepo.findByCompany(c).orElse(new RestaurantSettings());
        s.setCompany(c);
        if (payload.containsKey("storeName")) s.setStoreName((String) payload.get("storeName"));
        if (payload.containsKey("gstNumber")) s.setGstNumber((String) payload.get("gstNumber"));
        if (payload.containsKey("address")) s.setAddress((String) payload.get("address"));
        if (payload.containsKey("receiptFooter")) s.setReceiptFooter((String) payload.get("receiptFooter"));
        if (payload.containsKey("defaultTaxRate") && payload.get("defaultTaxRate") != null) {
            s.setDefaultTaxRate(new BigDecimal(payload.get("defaultTaxRate").toString()));
        }
        if (payload.containsKey("defaultDiscount") && payload.get("defaultDiscount") != null) {
            s.setDefaultDiscount(new BigDecimal(payload.get("defaultDiscount").toString()));
        }
        if (payload.containsKey("upiQrImageBase64")) s.setUpiQrImageBase64((String) payload.get("upiQrImageBase64"));
        
        if (payload.containsKey("currencySymbol")) s.setCurrencySymbol((String) payload.get("currencySymbol"));
        if (payload.containsKey("openingTime")) s.setOpeningTime((String) payload.get("openingTime"));
        if (payload.containsKey("closingTime")) s.setClosingTime((String) payload.get("closingTime"));
        return ResponseEntity.ok(settingsRepo.save(s));
    }

    @GetMapping("/printers")
    public ResponseEntity<?> getPrinters() {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.ok(Collections.emptyList());
        return ResponseEntity.ok(printerRepo.findByCompany(c));
    }
    
    @PostMapping("/printers")
    public ResponseEntity<?> addPrinter(@RequestBody RestaurantPrinter printer) {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(400).body(Map.of("message", "No company found to associate printer"));
        printer.setCompany(c);
        return ResponseEntity.ok(printerRepo.save(printer));
    }
    
    @DeleteMapping("/printers/{id}")
    public ResponseEntity<?> deletePrinter(@PathVariable Long id) {
        printerRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
