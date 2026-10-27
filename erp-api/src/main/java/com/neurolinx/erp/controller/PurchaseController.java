package com.neurolinx.erp.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import com.neurolinx.erp.service.InventoryService;
import com.neurolinx.erp.service.InvoiceParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

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
    @Autowired private GoodsReceiptRepository goodsReceiptRepository;
    @Autowired private InvoiceParserService invoiceParserService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Company getUserCompany() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                String email = auth.getName();
                var userOpt = userRepo.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (user.getCompany() != null) return user.getCompany();
                    if (user.getRole() != null && user.getRole().getCompany() != null) return user.getRole().getCompany();
                }
            }
        } catch (Exception ignored) {}
        return companyRepo.findAll().stream().findFirst().orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getPurchases(@RequestParam(required = false) Long vendorId) {
        try {
            Company company = getUserCompany();
            if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

            if (vendorId != null) {
                var vendorOpt = vendorRepository.findById(vendorId);
                if (vendorOpt.isPresent()) {
                    return ResponseEntity.ok(purchaseOrderRepository.findByVendor(vendorOpt.get()));
                }
            }
            return ResponseEntity.ok(purchaseOrderRepository.findByCompany(company));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
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

        BigDecimal invoiceTotal = payload.containsKey("invoiceTotal") && payload.get("invoiceTotal") != null
                ? new BigDecimal(payload.get("invoiceTotal").toString())
                : null;
        BigDecimal taxableAmount = payload.containsKey("taxableAmount") && payload.get("taxableAmount") != null
                ? new BigDecimal(payload.get("taxableAmount").toString())
                : null;
        BigDecimal taxAmount = payload.containsKey("taxAmount") && payload.get("taxAmount") != null
                ? new BigDecimal(payload.get("taxAmount").toString())
                : null;

        try {
            Map<String, Object> result = inventoryService.receiveStock(
                    po,
                    invoiceNumber,
                    invoiceDate,
                    receiptDate,
                    amountPaid,
                    payload.containsKey("paymentMethod") && payload.get("paymentMethod") != null ? payload.get("paymentMethod").toString() : "CREDIT",
                    payload.containsKey("paymentReference") && payload.get("paymentReference") != null ? payload.get("paymentReference").toString() : null,
                    payload.containsKey("paymentDate") && payload.get("paymentDate") != null ? LocalDate.parse(payload.get("paymentDate").toString()) : LocalDate.now(),
                    invoiceTotal,
                    taxableAmount,
                    taxAmount,
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

    @GetMapping("/receipts")
    public ResponseEntity<?> getGoodsReceipts(@RequestParam(required = false) Long vendorId, @RequestParam(required = false) Long poId) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (poId != null) {
            var poOpt = purchaseOrderRepository.findById(poId);
            if (poOpt.isPresent()) {
                return ResponseEntity.ok(goodsReceiptRepository.findByPurchaseOrderOrderByCreatedAtDesc(poOpt.get()));
            }
        }
        if (vendorId != null) {
            var vOpt = vendorRepository.findById(vendorId);
            if (vOpt.isPresent()) {
                return ResponseEntity.ok(goodsReceiptRepository.findByVendorOrderByCreatedAtDesc(vOpt.get()));
            }
        }
        return ResponseEntity.ok(goodsReceiptRepository.findByCompanyOrderByCreatedAtDesc(company));
    }

    @PostMapping("/{id}/attach-invoice")
    @Transactional
    public ResponseEntity<?> attachInvoice(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return purchaseOrderRepository.findById(id).map(po -> {
            if (company != null && po.getCompany() != null && !po.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            }
            String docUrl = payload.containsKey("invoiceAttachmentUrl") && payload.get("invoiceAttachmentUrl") != null ? payload.get("invoiceAttachmentUrl").toString() : null;
            String docName = payload.containsKey("invoiceAttachmentName") && payload.get("invoiceAttachmentName") != null ? payload.get("invoiceAttachmentName").toString() : null;

            if (docUrl != null) po.setInvoiceAttachmentUrl(docUrl);
            if (docName != null) po.setInvoiceAttachmentName(docName);

            if (payload.containsKey("invoiceData") && payload.get("invoiceData") != null) {
                po.setInvoiceData(payload.get("invoiceData").toString());
                try {
                    Map<String, Object> parsed = objectMapper.readValue(payload.get("invoiceData").toString(), new TypeReference<Map<String, Object>>() {});
                    if (parsed.containsKey("invoiceNumber")) po.setInvoiceNumber(parsed.get("invoiceNumber").toString());
                    if (parsed.containsKey("invoiceDate")) po.setInvoiceDate(LocalDate.parse(parsed.get("invoiceDate").toString()));
                } catch (Exception ignored) {}
            } else if (docName != null || docUrl != null) {
                Map<String, Object> extracted = invoiceParserService.extractInvoiceData(docName, docUrl);
                List<Map<String, Object>> rawItems = (List<Map<String, Object>>) extracted.getOrDefault("items", Collections.emptyList());
                List<Map<String, Object>> reconciled = invoiceParserService.reconcileWithPO(rawItems, po, company);
                extracted.put("items", reconciled);
                try {
                    po.setInvoiceData(objectMapper.writeValueAsString(extracted));
                    if (extracted.containsKey("invoiceNumber")) po.setInvoiceNumber(extracted.get("invoiceNumber").toString());
                    if (extracted.containsKey("invoiceDate")) po.setInvoiceDate(LocalDate.parse(extracted.get("invoiceDate").toString()));
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(purchaseOrderRepository.save(po));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/extract-invoice")
    public ResponseEntity<?> extractInvoice(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var poOpt = purchaseOrderRepository.findById(id);
        if (poOpt.isEmpty()) return ResponseEntity.notFound().build();
        PurchaseOrder po = poOpt.get();

        String docName = payload.containsKey("documentName") && payload.get("documentName") != null ? payload.get("documentName").toString() : "";
        String docContent = payload.containsKey("documentUrl") && payload.get("documentUrl") != null ? payload.get("documentUrl").toString() : "";

        Map<String, Object> extracted = invoiceParserService.extractInvoiceData(docName, docContent);
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) extracted.getOrDefault("items", Collections.emptyList());
        List<Map<String, Object>> reconciled = invoiceParserService.reconcileWithPO(rawItems, po, company);
        extracted.put("items", reconciled);

        return ResponseEntity.ok(extracted);
    }

    @PostMapping("/{id}/verify-invoice")
    public ResponseEntity<?> verifyInvoice(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
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

        if (!payload.containsKey("invoiceNumber") || payload.get("invoiceNumber") == null || payload.get("invoiceNumber").toString().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "status", "EMPTY", "message", "Invoice number is required for verification"));
        }

        String inputInvoice = payload.get("invoiceNumber").toString().trim();

        // 1. Vendor Mismatch Check
        if (payload.containsKey("vendorId") && payload.get("vendorId") != null) {
            Long vendorId = Long.parseLong(payload.get("vendorId").toString());
            if (po.getVendor() != null && !po.getVendor().getId().equals(vendorId)) {
                return ResponseEntity.ok(Map.of(
                        "verified", false,
                        "status", "VENDOR_MISMATCH",
                        "message", "Vendor Mismatch: Selected vendor does not match the vendor on Purchase Order #" + po.getPoNumber() + " (" + po.getVendor().getName() + ")."
                ));
            }
        }

        // 2. Duplicate Invoice Check
        if (goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(po, inputInvoice)) {
            return ResponseEntity.ok(Map.of(
                    "verified", false,
                    "status", "DUPLICATE",
                    "message", "Duplicate Invoice Detected: Invoice #" + inputInvoice + " has already been processed and inwarded into stock for Purchase Order #" + po.getPoNumber() + ". Duplicate stock posting is prohibited."
            ));
        }

        // 3. Check against stored verified invoiceData if present
        if (po.getInvoiceData() != null && !po.getInvoiceData().trim().isEmpty()) {
            try {
                Map<String, Object> invData = objectMapper.readValue(po.getInvoiceData(), new TypeReference<Map<String, Object>>() {});
                String storedInvNum = invData.getOrDefault("invoiceNumber", "").toString().trim();

                if (storedInvNum.equalsIgnoreCase(inputInvoice)) {
                    // Check if invoice vendor matches PO vendor
                    Object invVendorName = invData.get("vendorName");
                    Object invVendorGstin = invData.get("vendorGstin");
                    if (po.getVendor() != null && !invoiceParserService.isVendorMatch(po.getVendor(), invVendorName, invVendorGstin)) {
                        return ResponseEntity.ok(Map.of(
                                "verified", false,
                                "status", "VENDOR_MISMATCH",
                                "message", "Vendor Mismatch: The supplier on this invoice ('" + (invVendorName != null ? invVendorName : "Unknown") + "') does not match the vendor on Purchase Order #" + po.getPoNumber() + " ('" + po.getVendor().getName() + "'). Please ensure the invoice belongs to the selected vendor."
                        ));
                    }

                    List<Map<String, Object>> rawItems = (List<Map<String, Object>>) invData.getOrDefault("items", Collections.emptyList());
                    List<Map<String, Object>> reconciled = invoiceParserService.reconcileWithPO(rawItems, po, company);

                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("verified", true);
                    response.put("status", "VERIFIED");
                    response.put("message", "Supplier Invoice #" + inputInvoice + " verified successfully against original uploaded document.");
                    response.put("invoiceNumber", storedInvNum);
                    response.put("invoiceDate", invData.getOrDefault("invoiceDate", po.getInvoiceDate() != null ? po.getInvoiceDate().toString() : LocalDate.now().toString()));
                    response.put("vendorName", invData.getOrDefault("vendorName", po.getVendor() != null ? po.getVendor().getName() : "Vendor"));
                    response.put("vendorGstin", invData.getOrDefault("vendorGstin", ""));
                    response.put("subtotal", invData.getOrDefault("subtotal", invData.getOrDefault("taxableAmount", po.getTotalAmount())));
                    response.put("discountAmount", invData.getOrDefault("discountAmount", BigDecimal.ZERO));
                    response.put("taxableAmount", invData.getOrDefault("taxableAmount", BigDecimal.ZERO));
                    response.put("cgstAmount", invData.getOrDefault("cgstAmount", BigDecimal.ZERO));
                    response.put("sgstAmount", invData.getOrDefault("sgstAmount", BigDecimal.ZERO));
                    response.put("taxAmount", invData.getOrDefault("taxAmount", BigDecimal.ZERO));
                    response.put("invoiceTotal", invData.getOrDefault("invoiceTotal", po.getTotalAmount()));
                    response.put("items", reconciled);
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.ok(Map.of(
                            "verified", false,
                            "status", "MISMATCH",
                            "message", "Invoice Number Mismatch: Entered invoice #" + inputInvoice + " does not match the verified original supplier invoice #" + storedInvNum + " attached to this Purchase Order."
                    ));
                }
            } catch (Exception ignored) {}
        }

        // 4. Check against PO's registered invoiceNumber
        String registeredInv = po.getInvoiceNumber() != null ? po.getInvoiceNumber().trim() : "";
        boolean isDefaultPoInv = registeredInv.startsWith("INV-PO-");

        if (!isDefaultPoInv && !registeredInv.isEmpty()) {
            if (registeredInv.equalsIgnoreCase(inputInvoice)) {
                List<Map<String, Object>> poItemsList = buildItemsFromPO(po);
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("verified", true);
                response.put("status", "VERIFIED");
                response.put("message", "Supplier Invoice #" + inputInvoice + " verified successfully against Purchase Order #" + po.getPoNumber());
                response.put("invoiceNumber", registeredInv);
                response.put("invoiceDate", po.getInvoiceDate() != null ? po.getInvoiceDate().toString() : LocalDate.now().toString());
                response.put("vendorName", po.getVendor() != null ? po.getVendor().getName() : "");
                response.put("taxableAmount", po.getTotalAmount());
                response.put("taxAmount", BigDecimal.ZERO);
                response.put("invoiceTotal", po.getTotalAmount());
                response.put("items", poItemsList);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.ok(Map.of(
                        "verified", false,
                        "status", "INVALID",
                        "message", "Invalid Invoice Number: Invoice '" + inputInvoice + "' does not match registered supplier invoice #" + registeredInv + " for PO #" + po.getPoNumber() + "."
                ));
            }
        }

        // 5. If no invoice document or verified data is attached yet:
        return ResponseEntity.ok(Map.of(
                "verified", false,
                "status", "UNVERIFIED",
                "message", "Invoice Verification Failed: No verified supplier invoice document found for invoice '" + inputInvoice + "' on PO #" + po.getPoNumber() + ". Please upload the original vendor invoice PDF / scanned challan to verify real items and pricing."
        ));
    }

    private List<Map<String, Object>> buildItemsFromPO(PurchaseOrder po) {
        List<Map<String, Object>> items = new ArrayList<>();
        if (po.getItems() != null) {
            for (PurchaseOrderItem poi : po.getItems()) {
                if (poi.getIngredient() == null) continue;
                Ingredient ing = poi.getIngredient();
                BigDecimal ordered = poi.getQuantityOrdered() != null ? poi.getQuantityOrdered() : BigDecimal.ZERO;
                BigDecimal received = poi.getQuantityReceived() != null ? poi.getQuantityReceived() : BigDecimal.ZERO;
                BigDecimal remaining = ordered.subtract(received);
                if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("itemCode", "RM-" + ing.getId());
                row.put("description", ing.getName());
                row.put("shortName", ing.getName());
                row.put("quantity", ordered);
                row.put("unit", poi.getUnit() != null ? poi.getUnit() : ing.getUnit());
                row.put("unitRate", poi.getUnitCost() != null ? poi.getUnitCost() : ing.getCostPerUnit());
                row.put("discountPercent", BigDecimal.ZERO);
                row.put("taxRate", BigDecimal.ZERO);
                row.put("taxAmount", BigDecimal.ZERO);
                row.put("lineTotal", (poi.getUnitCost() != null ? poi.getUnitCost() : BigDecimal.ZERO).multiply(ordered));
                row.put("matchedIngredientId", ing.getId());
                row.put("matchedIngredientName", ing.getName());
                row.put("orderedQuantity", ordered);
                row.put("alreadyReceivedQuantity", received);
                row.put("remainingQuantity", remaining);
                row.put("receivingQuantity", remaining);
                row.put("costPerUnit", poi.getUnitCost() != null ? poi.getUnitCost() : ing.getCostPerUnit());
                row.put("mismatchFlag", false);
                items.add(row);
            }
        }
        return items;
    }
}
