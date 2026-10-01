package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/purchases")
public class PurchaseController {

    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private StockBatchRepository stockBatchRepository;
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
    public ResponseEntity<?> getPurchases() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(purchaseOrderRepository.findByCompany(company));
    }

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> createPurchase(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (!payload.containsKey("vendorId") || !payload.containsKey("items")) {
            return ResponseEntity.badRequest().body(Map.of("message", "vendorId and items are required"));
        }

        Long vendorId = Long.parseLong(payload.get("vendorId").toString());
        Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
        if (vendor == null || !vendor.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid vendor"));
        }

        PurchaseOrder order = new PurchaseOrder();
        order.setCompany(company);
        order.setVendor(vendor);
        if (payload.containsKey("invoiceNumber")) order.setInvoiceNumber(payload.get("invoiceNumber").toString());
        if (payload.containsKey("invoiceDate") && payload.get("invoiceDate") != null) {
            order.setInvoiceDate(LocalDate.parse(payload.get("invoiceDate").toString()));
        } else {
            order.setInvoiceDate(LocalDate.now());
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        if (payload.containsKey("totalAmount")) {
            totalAmount = new BigDecimal(payload.get("totalAmount").toString());
        }
        order.setTotalAmount(totalAmount);
        
        if (payload.containsKey("amountPaid")) {
            BigDecimal amountPaid = new BigDecimal(payload.get("amountPaid").toString());
            order.setAmountPaid(amountPaid);
            if (amountPaid.compareTo(totalAmount) >= 0) order.setStatus("Paid");
            else if (amountPaid.compareTo(BigDecimal.ZERO) > 0) order.setStatus("Partially Paid");
        }

        order = purchaseOrderRepository.save(order);

        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        for (Map<String, Object> item : items) {
            Long ingId = Long.parseLong(item.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
            if (ing != null) {
                BigDecimal qty = new BigDecimal(item.get("quantity").toString());
                BigDecimal cost = new BigDecimal(item.get("costPerUnit").toString());
                
                StockBatch batch = new StockBatch();
                batch.setCompany(company);
                batch.setPurchaseOrder(order);
                batch.setIngredient(ing);
                batch.setInitialQuantity(qty);
                batch.setCurrentQuantity(qty);
                batch.setCostPerUnit(cost);
                if (item.containsKey("expiryDate") && item.get("expiryDate") != null) {
                    batch.setExpiryDate(LocalDate.parse(item.get("expiryDate").toString()));
                }
                stockBatchRepository.save(batch);

                ing.setStockLevel(ing.getStockLevel().add(qty));
                ingredientRepository.save(ing);
            }
        }

        return ResponseEntity.ok(order);
    }
}
