package com.tech.source.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tech.source.model.*;
import com.tech.source.repository.*;
import com.tech.source.service.InventoryService;
import com.tech.source.service.InvoiceParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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

    @Value("${erp.upload.invoice-dir:uploads/invoices}")
    private String invoiceUploadDir;

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

        @PostMapping(value = "/{id}/upload-invoice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadInvoice(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var poOpt = purchaseOrderRepository.findById(id);
        if (poOpt.isEmpty()) return ResponseEntity.notFound().build();
        PurchaseOrder po = poOpt.get();

        if (company != null && po.getCompany() != null && !po.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is required and cannot be empty"));
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "invoice.pdf");
        if (originalFilename.contains("..")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
        }

        String lowerName = originalFilename.toLowerCase();
        if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".jpg") && !lowerName.endsWith(".jpeg") && !lowerName.endsWith(".png")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PDF, JPG, and PNG invoice documents are supported"));
        }

        try {
            Path uploadPath = Paths.get(invoiceUploadDir != null ? invoiceUploadDir : "uploads/invoices").toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String safeBase = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String uniqueFilename = "po_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + safeBase;
            Path targetPath = uploadPath.resolve(uniqueFilename).normalize();

            if (!targetPath.startsWith(uploadPath)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid file path"));
            }

            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            String relativeUrl = "/api/inventory/purchases/invoices/" + uniqueFilename;
            po.setInvoiceAttachmentUrl(relativeUrl);
            po.setInvoiceAttachmentName(originalFilename);

            byte[] fileBytes = file.getBytes();
            Map<String, Object> extracted = invoiceParserService.extractInvoiceData(originalFilename, fileBytes);
            if (extracted != null && !extracted.isEmpty()) {
                List<Map<String, Object>> rawItems = (List<Map<String, Object>>) extracted.getOrDefault("items", Collections.emptyList());
                List<Map<String, Object>> reconciled = invoiceParserService.reconcileWithPO(rawItems, po, company);
                extracted.put("items", reconciled);
                try {
                    po.setInvoiceData(objectMapper.writeValueAsString(extracted));
                    if (extracted.containsKey("invoiceNumber") && extracted.get("invoiceNumber") != null) {
                        po.setInvoiceNumber(extracted.get("invoiceNumber").toString());
                    }
                    if (extracted.containsKey("invoiceDate") && extracted.get("invoiceDate") != null) {
                        po.setInvoiceDate(LocalDate.parse(extracted.get("invoiceDate").toString()));
                    }
                } catch (Exception ignored) {}
            }

            PurchaseOrder saved = purchaseOrderRepository.save(po);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("success", true);
            resp.put("poId", saved.getId());
            resp.put("invoiceAttachmentUrl", saved.getInvoiceAttachmentUrl());
            resp.put("invoiceAttachmentName", saved.getInvoiceAttachmentName());
            resp.put("invoiceNumber", saved.getInvoiceNumber() != null ? saved.getInvoiceNumber() : "");
            resp.put("invoiceDate", saved.getInvoiceDate() != null ? saved.getInvoiceDate().toString() : "");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to store invoice file: " + e.getMessage()));
        }
    }

    @GetMapping("/invoices/{filename:.+}")
    public ResponseEntity<Resource> getInvoiceDocument(@PathVariable String filename) {
        try {
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }
            Path uploadPath = Paths.get(invoiceUploadDir != null ? invoiceUploadDir : "uploads/invoices").toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(filename).normalize();
            if (!filePath.startsWith(uploadPath) || !Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
                else if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
                else contentType = "image/jpeg";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
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

        // 2. Duplicate Invoice Check across vendor
        if (po.getVendor() != null && goodsReceiptRepository.existsByVendorAndInvoiceNumberIgnoreCase(po.getVendor(), inputInvoice)) {
            return ResponseEntity.ok(Map.of(
                    "verified", false,
                    "status", "DUPLICATE",
                    "message", "Duplicate Invoice Blocked: Invoice #" + inputInvoice + " has already been processed and inwarded into stock for vendor " + po.getVendor().getName() + ". Duplicate stock inwarding is strictly prohibited under GST law."
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

        // 4. Authenticate Invoice Number directly via E-Invoice / Supplier Catalog (e.g. Zepto/Geddit 261036G002900941 or attached doc)
        Map<String, Object> extracted = invoiceParserService.extractInvoiceData(inputInvoice, po.getInvoiceAttachmentUrl());
        if (extracted != null && extracted.containsKey("items") && !((List<?>) extracted.get("items")).isEmpty()) {
            Object invVendorName = extracted.get("vendorName");
            Object invVendorGstin = extracted.get("vendorGstin");
            if (po.getVendor() != null && !invoiceParserService.isVendorMatch(po.getVendor(), invVendorName, invVendorGstin)) {
                return ResponseEntity.ok(Map.of(
                        "verified", false,
                        "status", "VENDOR_MISMATCH",
                        "message", "Vendor Mismatch: The supplier on invoice #" + inputInvoice + " ('" + (invVendorName != null ? invVendorName : "Unknown") + "') does not match the vendor on Purchase Order #" + po.getPoNumber() + " ('" + po.getVendor().getName() + "')."
                ));
            }

            List<Map<String, Object>> rawItems = (List<Map<String, Object>>) extracted.getOrDefault("items", Collections.emptyList());
            List<Map<String, Object>> reconciled = invoiceParserService.reconcileWithPO(rawItems, po, company);

            // Persist verified invoice payload on PO
            try {
                po.setInvoiceData(objectMapper.writeValueAsString(extracted));
                po.setInvoiceNumber(inputInvoice);
                purchaseOrderRepository.save(po);
            } catch (Exception ignored) {}

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("verified", true);
            response.put("status", "VERIFIED");
            response.put("message", "Supplier Invoice #" + inputInvoice + " authenticated successfully. Genuine line items, pack sizes, and prices loaded.");
            response.put("invoiceNumber", inputInvoice);
            response.put("invoiceDate", extracted.getOrDefault("invoiceDate", po.getInvoiceDate() != null ? po.getInvoiceDate().toString() : LocalDate.now().toString()));
            response.put("vendorName", extracted.getOrDefault("vendorName", po.getVendor() != null ? po.getVendor().getName() : "Vendor"));
            response.put("vendorGstin", extracted.getOrDefault("vendorGstin", ""));
            response.put("subtotal", extracted.getOrDefault("subtotal", po.getTotalAmount()));
            response.put("discountAmount", extracted.getOrDefault("discountAmount", BigDecimal.ZERO));
            response.put("taxableAmount", extracted.getOrDefault("taxableAmount", BigDecimal.ZERO));
            response.put("cgstAmount", extracted.getOrDefault("cgstAmount", BigDecimal.ZERO));
            response.put("sgstAmount", extracted.getOrDefault("sgstAmount", BigDecimal.ZERO));
            response.put("taxAmount", extracted.getOrDefault("taxAmount", BigDecimal.ZERO));
            response.put("invoiceTotal", extracted.getOrDefault("invoiceTotal", po.getTotalAmount()));
            response.put("items", reconciled);
            return ResponseEntity.ok(response);
        }

        // 5. Check against PO's registered invoiceNumber if pre-recorded with genuine prices
        String registeredInv = po.getInvoiceNumber() != null ? po.getInvoiceNumber().trim() : "";
        boolean isDefaultPoInv = registeredInv.startsWith("INV-PO-");

        if (!isDefaultPoInv && !registeredInv.isEmpty() && registeredInv.equalsIgnoreCase(inputInvoice)) {
            List<Map<String, Object>> poLineItems = new ArrayList<>();
            BigDecimal calculatedTotal = BigDecimal.ZERO;

            if (po.getItems() != null && !po.getItems().isEmpty()) {
                for (PurchaseOrderItem poi : po.getItems()) {
                    Ingredient ing = poi.getIngredient();
                    BigDecimal ordered = poi.getQuantityOrdered() != null ? poi.getQuantityOrdered() : BigDecimal.ZERO;
                    BigDecimal received = poi.getQuantityReceived() != null ? poi.getQuantityReceived() : BigDecimal.ZERO;
                    BigDecimal remaining = ordered.subtract(received);
                    if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

                    BigDecimal unitCost = poi.getUnitCost() != null ? poi.getUnitCost()
                            : (ing != null && ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO);
                    BigDecimal lineTotal = unitCost.multiply(remaining);
                    calculatedTotal = calculatedTotal.add(lineTotal);

                    String unit = poi.getUnit() != null && !poi.getUnit().trim().isEmpty() ? poi.getUnit()
                            : (ing != null && ing.getUnit() != null ? ing.getUnit() : "kg");

                    Map<String, Object> itemMap = new LinkedHashMap<>();
                    itemMap.put("matchedIngredientId", ing != null ? ing.getId() : null);
                    itemMap.put("matchedIngredientName", ing != null ? ing.getName() : "Raw Material");
                    itemMap.put("shortName", ing != null ? ing.getName() : "Raw Material");
                    itemMap.put("description", ing != null ? ing.getName() : "Raw Material");
                    itemMap.put("itemCode", ing != null && ing.getBarcode() != null ? ing.getBarcode() : "");
                    itemMap.put("invoiceQuantity", remaining);
                    itemMap.put("invoiceUnit", unit);
                    itemMap.put("packSize", BigDecimal.ONE);
                    itemMap.put("packUnit", unit);
                    itemMap.put("multiplier", BigDecimal.ONE);
                    itemMap.put("baseUnit", unit);
                    itemMap.put("inwardQuantity", remaining);
                    itemMap.put("orderedQuantity", ordered);
                    itemMap.put("alreadyReceivedQuantity", received);
                    itemMap.put("remainingQuantity", remaining);
                    itemMap.put("receivingQuantity", remaining);
                    itemMap.put("unitRate", unitCost);
                    itemMap.put("costPerUnit", unitCost);
                    itemMap.put("mrp", unitCost);
                    itemMap.put("discountPercent", BigDecimal.ZERO);
                    itemMap.put("discountAmount", BigDecimal.ZERO);
                    itemMap.put("taxRate", BigDecimal.ZERO);
                    itemMap.put("taxAmount", BigDecimal.ZERO);
                    itemMap.put("lineTotal", lineTotal);
                    itemMap.put("mismatchFlag", false);
                    itemMap.put("mismatchReason", "");

                    poLineItems.add(itemMap);
                }
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("verified", true);
            response.put("status", "VERIFIED");
            response.put("message", "Supplier Invoice #" + inputInvoice + " verified successfully against PO #" + po.getPoNumber() + ".");
            response.put("invoiceNumber", inputInvoice);
            response.put("invoiceDate", po.getInvoiceDate() != null ? po.getInvoiceDate().toString() : LocalDate.now().toString());
            response.put("vendorName", po.getVendor() != null ? po.getVendor().getName() : "Supplier");
            response.put("subtotal", po.getTotalAmount() != null ? po.getTotalAmount() : calculatedTotal);
            response.put("invoiceTotal", po.getTotalAmount() != null ? po.getTotalAmount() : calculatedTotal);
            response.put("items", poLineItems);
            return ResponseEntity.ok(response);
        }

        // 6. If invoice cannot be authenticated or is random text like 'safsdg'
        return ResponseEntity.ok(Map.of(
                "verified", false,
                "status", "INVALID",
                "message", "Invalid / Unverified Supplier Invoice: Invoice #" + inputInvoice + " could not be authenticated against supplier records or IRP portal. Please enter a genuine supplier invoice number (e.g. 261036G002900941) or attach the invoice document."
        ));
    }
}
