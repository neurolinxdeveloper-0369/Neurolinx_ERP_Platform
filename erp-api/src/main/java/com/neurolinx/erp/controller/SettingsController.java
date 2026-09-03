package com.neurolinx.erp.controller;
import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    @Autowired private RestaurantSettingsRepository settingsRepo;
    @Autowired private RestaurantPrinterRepository printerRepo;
    @Autowired private UserRepository userRepo;
    
    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByEmail(email).map(u -> u.getRole().getCompany()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(403).build();
        RestaurantSettings s = settingsRepo.findByCompany(c).orElse(new RestaurantSettings());
        return ResponseEntity.ok(s);
    }
    
    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, Object> payload) {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(403).build();
        RestaurantSettings s = settingsRepo.findByCompany(c).orElse(new RestaurantSettings());
        s.setCompany(c);
        if (payload.containsKey("storeName")) s.setStoreName((String) payload.get("storeName"));
        if (payload.containsKey("gstNumber")) s.setGstNumber((String) payload.get("gstNumber"));
        if (payload.containsKey("address")) s.setAddress((String) payload.get("address"));
        if (payload.containsKey("receiptFooter")) s.setReceiptFooter((String) payload.get("receiptFooter"));
        if (payload.containsKey("defaultTaxRate")) s.setDefaultTaxRate(new BigDecimal(payload.get("defaultTaxRate").toString()));
        if (payload.containsKey("defaultDiscount")) s.setDefaultDiscount(new BigDecimal(payload.get("defaultDiscount").toString()));
        if (payload.containsKey("upiQrImageBase64")) s.setUpiQrImageBase64((String) payload.get("upiQrImageBase64"));
        return ResponseEntity.ok(settingsRepo.save(s));
    }

    @GetMapping("/printers")
    public ResponseEntity<?> getPrinters() {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(printerRepo.findByCompany(c));
    }
    
    @PostMapping("/printers")
    public ResponseEntity<?> addPrinter(@RequestBody RestaurantPrinter printer) {
        Company c = getUserCompany();
        if (c == null) return ResponseEntity.status(403).build();
        printer.setCompany(c);
        return ResponseEntity.ok(printerRepo.save(printer));
    }
    
    @DeleteMapping("/printers/{id}")
    public ResponseEntity<?> deletePrinter(@PathVariable Long id) {
        printerRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
