package com.tech.source.controller;

import com.tech.source.model.Company;
import com.tech.source.model.User;
import com.tech.source.model.Vendor;
import com.tech.source.repository.CompanyRepository;
import com.tech.source.repository.UserRepository;
import com.tech.source.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory/vendors")
public class VendorController {

    @Autowired private VendorRepository vendorRepository;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;
    @Autowired private JdbcTemplate jdbcTemplate;

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
    public ResponseEntity<?> getVendors() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(vendorRepository.findByCompany(company));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createVendor(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        Vendor vendor = new Vendor();
        vendor.setCompany(company);
        if (payload.containsKey("name")) vendor.setName(payload.get("name").toString());
        if (payload.containsKey("contactPerson")) vendor.setContactPerson(payload.get("contactPerson").toString());
        if (payload.containsKey("phone")) vendor.setPhone(payload.get("phone").toString());
        if (payload.containsKey("email")) vendor.setEmail(payload.get("email").toString());
        if (payload.containsKey("address")) vendor.setAddress(payload.get("address").toString());
        if (payload.containsKey("gstNumber")) vendor.setGstNumber(payload.get("gstNumber").toString());
        
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateVendor(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return vendorRepository.findById(id).map(vendor -> {
            if (company != null && vendor.getCompany() != null && !vendor.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            }
            if (payload.containsKey("name")) vendor.setName(payload.get("name").toString());
            if (payload.containsKey("contactPerson")) vendor.setContactPerson(payload.get("contactPerson").toString());
            if (payload.containsKey("phone")) vendor.setPhone(payload.get("phone").toString());
            if (payload.containsKey("email")) vendor.setEmail(payload.get("email").toString());
            if (payload.containsKey("address")) vendor.setAddress(payload.get("address").toString());
            if (payload.containsKey("gstNumber")) vendor.setGstNumber(payload.get("gstNumber").toString());
            return ResponseEntity.ok(vendorRepository.save(vendor));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteVendor(@PathVariable Long id) {
        Company company = getUserCompany();
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Vendor vendor = vendorOpt.get();
        if (company != null && vendor.getCompany() != null && !vendor.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        }

        try {
            // 1. Unlink any ingredients that have this vendor as preferred vendor
            jdbcTemplate.update("UPDATE ingredients SET preferred_vendor_id = NULL WHERE preferred_vendor_id = ?", id);

            // 2. Unlink any FIFO stock batches referencing purchase orders belonging to this vendor
            jdbcTemplate.update("UPDATE stock_batches SET purchase_order_id = NULL WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE vendor_id = ?)", id);

            // 3. Delete goods receipt items for any goods receipts tied to this vendor or its purchase orders
            jdbcTemplate.update("DELETE FROM goods_receipt_items WHERE goods_receipt_id IN (SELECT id FROM goods_receipts WHERE vendor_id = ? OR purchase_order_id IN (SELECT id FROM purchase_orders WHERE vendor_id = ?))", id, id);

            // 4. Delete goods receipts tied to this vendor or its purchase orders
            jdbcTemplate.update("DELETE FROM goods_receipts WHERE vendor_id = ? OR purchase_order_id IN (SELECT id FROM purchase_orders WHERE vendor_id = ?)", id, id);

            // 5. Delete purchase order items belonging to this vendor's purchase orders
            jdbcTemplate.update("DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE vendor_id = ?)", id);

            // 6. Delete purchase orders belonging to this vendor
            jdbcTemplate.update("DELETE FROM purchase_orders WHERE vendor_id = ?", id);

            // 7. Delete the vendor itself from PostgreSQL
            vendorRepository.delete(vendor);
            vendorRepository.flush();
            
            return ResponseEntity.ok(Map.of("message", "Vendor and associated records deleted successfully from database", "id", id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to delete vendor: " + e.getMessage()));
        }
    }
}