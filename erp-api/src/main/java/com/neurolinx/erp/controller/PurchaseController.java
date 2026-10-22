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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/purchases")
public class PurchaseController {

    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private StockBatchRepository stockBatchRepository;
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
    public ResponseEntity<?> getPurchases(@RequestParam(required = false) Long vendorId) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (vendorId != null) {
            var vendorOpt = vendorRepository.findById(vendorId);
            if (vendorOpt.isPresent()) {
                return ResponseEntity.ok(purchaseOrderRepository.findByVendor(vendorOpt.get()));
            }
        }
        return ResponseEntity.ok(purchaseOrderRepository.findByCompany(company));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseOrderById(@PathVariable Long id) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return purchaseOrderRepository.findById(id).map(po -> {
            if (company != null && po.getCompany() != null && !po.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            }
            return ResponseEntity.ok(po);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createPurchaseOrder(@RequestBody Map<String, Object> payload) {
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

        String poNum = payload.containsKey("poNumber") && payload.get("poNumber") != null && !payload.get("poNumber").toString().isEmpty()
                ? payload.get("poNumber").toString()
                : "PO-" + System.currentTimeMillis();
        order.setPoNumber(poNum);

        String invNum = payload.containsKey("invoiceNumber") && payload.get("invoiceNumber") != null && !payload.get("invoiceNumber").toString().isEmpty()
                ? payload.get("invoiceNumber").toString()
                : ("INV-" + poNum);
        order.setInvoiceNumber(invNum);

        if (payload.containsKey("invoiceDate") && payload.get("invoiceDate") != null && !payload.get("invoiceDate").toString().isEmpty()) {
            order.setInvoiceDate(LocalDate.parse(payload.get("invoiceDate").toString()));
        } else {
            order.setInvoiceDate(LocalDate.now());
        }

        if (payload.containsKey("expectedDeliveryDate") && payload.get("expectedDeliveryDate") != null && !payload.get("expectedDeliveryDate").toString().isEmpty()) {
            order.setExpectedDeliveryDate(LocalDate.parse(payload.get("expectedDeliveryDate").toString()));
        }

        if (payload.containsKey("notes") && payload.get("notes") != null) {
            order.setNotes(payload.get("notes").toString());
        }

        String status = payload.containsKey("status") && payload.get("status") != null ? payload.get("status").toString() : "Ordered";
        order.setStatus(status);

        BigDecimal totalAmount = BigDecimal.ZERO;
        if (payload.containsKey("totalAmount") && payload.get("totalAmount") != null) {
            totalAmount = new BigDecimal(payload.get("totalAmount").toString());
        }

        BigDecimal amountPaid = BigDecimal.ZERO;
        if (payload.containsKey("amountPaid") && payload.get("amountPaid") != null) {
            amountPaid = new BigDecimal(payload.get("amountPaid").toString());
        }
        order.setTotalAmount(totalAmount);
        order.setAmountPaid(amountPaid);

        // Save order header first
        order = purchaseOrderRepository.save(order);

        // Process line items
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        List<PurchaseOrderItem> orderItems = new ArrayList<>();
        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (Map<String, Object> itemData : items) {
            Long ingId = Long.parseLong(itemData.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
            if (ing != null) {
                BigDecimal qty = new BigDecimal(itemData.get("quantity").toString());
                BigDecimal cost = itemData.containsKey("costPerUnit") && itemData.get("costPerUnit") != null
                        ? new BigDecimal(itemData.get("costPerUnit").toString())
                        : ing.getCostPerUnit();

                String unit = itemData.containsKey("unit") && itemData.get("unit") != null
                        ? itemData.get("unit").toString()
                        : ing.getUnit();

                PurchaseOrderItem poi = new PurchaseOrderItem();
                poi.setPurchaseOrder(order);
                poi.setIngredient(ing);
                poi.setQuantityOrdered(qty);
                poi.setQuantityReceived(BigDecimal.ZERO);
                poi.setUnitCost(cost);
                poi.setUnit(unit);

                orderItems.add(purchaseOrderItemRepository.save(poi));
                calculatedTotal = calculatedTotal.add(cost.multiply(qty));
            }
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) == 0 && calculatedTotal.compareTo(BigDecimal.ZERO) > 0) {
            order.setTotalAmount(calculatedTotal);
            order = purchaseOrderRepository.save(order);
        }

        order.setItems(orderItems);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/receive")
    @Transactional
    public ResponseEntity<?> receiveStock(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var poOpt = purchaseOrderRepository.findById(id);
        if (poOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder po = poOpt.get();
        if (company != null && po.getCompany() != null && !po.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        }

        if ("Cancelled".equalsIgnoreCase(po.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot receive stock for a cancelled purchase order"));
        }

        String invoiceNumber = payload.containsKey("invoiceNumber") && payload.get("invoiceNumber") != null
                ? payload.get("invoiceNumber").toString()
                : po.getInvoiceNumber();

        LocalDate invoiceDate = payload.containsKey("invoiceDate") && payload.get("invoiceDate") != null
                ? LocalDate.parse(payload.get("invoiceDate").toString())
                : LocalDate.now();

        LocalDate receiptDate = payload.containsKey("receiptDate") && payload.get("receiptDate") != null
                ? LocalDate.parse(payload.get("receiptDate").toString())
                : LocalDate.now();

        BigDecimal amountPaid = payload.containsKey("amountPaid") && payload.get("amountPaid") != null
                ? new BigDecimal(payload.get("amountPaid").toString())
                : null;

        if (!payload.containsKey("items") || payload.get("items") == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Items list is required for receiving stock"));
        }

        List<Map<String, Object>> receivedItems = (List<Map<String, Object>>) payload.get("items");
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            Map<String, Object> result = inventoryService.receiveStock(
                    po,
                    invoiceNumber,
                    invoiceDate,
                    receiptDate,
                    amountPaid,
                    receivedItems,
                    username
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updatePurchaseStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return purchaseOrderRepository.findById(id).map(po -> {
            if (company != null && po.getCompany() != null && !po.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            }
            if (payload.containsKey("status") && payload.get("status") != null) {
                po.setStatus(payload.get("status").toString());
            }
            return ResponseEntity.ok(purchaseOrderRepository.save(po));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batches")
    public ResponseEntity<?> getBatches() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(stockBatchRepository.findByCompany(company));
    }
}
