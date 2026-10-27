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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
    @Autowired private StockTransferRepository stockTransferRepository;
    @Autowired private StockTransferItemRepository stockTransferItemRepository;
    @Autowired private StockAuditRepository stockAuditRepository;
    @Autowired private StockAuditItemRepository stockAuditItemRepository;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Autowired private GoodsReceiptRepository goodsReceiptRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private DishRepository dishRepository;
    @Autowired private CustomerOrderRepository customerOrderRepository;
    @Autowired private WasteRepository wasteRepository;
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

    // ==========================================
    // 1. INGREDIENTS & STOCK LEDGER
    // ==========================================

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

    @GetMapping("/receipts")
    public ResponseEntity<?> getGoodsReceipts(@RequestParam(required = false) Long vendorId, @RequestParam(required = false) Long poId) {
        try {
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
        if (payload.get("parLevel") != null) {
            ing.setParLevel(new BigDecimal(payload.get("parLevel").toString()));
        }
        if (payload.get("costPerUnit") != null) {
            ing.setCostPerUnit(new BigDecimal(payload.get("costPerUnit").toString()));
        }
        if (payload.get("storageZone") != null) {
            ing.setStorageZone(payload.get("storageZone").toString());
        }
        if (payload.get("barcode") != null) {
            ing.setBarcode(payload.get("barcode").toString());
        }
        if (payload.get("preferredVendorId") != null && !payload.get("preferredVendorId").toString().isEmpty()) {
            try {
                Long vId = Long.parseLong(payload.get("preferredVendorId").toString());
                vendorRepository.findById(vId).ifPresent(ing::setPreferredVendor);
            } catch (Exception ignored) {}
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
            if (payload.containsKey("parLevel")) ing.setParLevel(new BigDecimal(payload.get("parLevel").toString()));
            if (payload.containsKey("costPerUnit")) ing.setCostPerUnit(new BigDecimal(payload.get("costPerUnit").toString()));
            if (payload.containsKey("storageZone")) ing.setStorageZone(payload.get("storageZone").toString());
            if (payload.containsKey("barcode")) ing.setBarcode(payload.get("barcode").toString());
            if (payload.containsKey("preferredVendorId")) {
                if (payload.get("preferredVendorId") != null && !payload.get("preferredVendorId").toString().isEmpty()) {
                    try {
                        Long vId = Long.parseLong(payload.get("preferredVendorId").toString());
                        vendorRepository.findById(vId).ifPresent(ing::setPreferredVendor);
                    } catch (Exception ignored) {}
                } else {
                    ing.setPreferredVendor(null);
                }
            }

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
        int parBreachedCount = 0;

        for (Ingredient ing : ingredients) {
            BigDecimal stock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal cost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            totalValuation = totalValuation.add(stock.multiply(cost));

            BigDecimal reorder = ing.getReorderLevel() != null ? ing.getReorderLevel() : BigDecimal.ZERO;
            BigDecimal par = ing.getParLevel() != null ? ing.getParLevel() : BigDecimal.ZERO;

            if (stock.compareTo(BigDecimal.ZERO) <= 0) {
                outOfStockCount++;
                lowStockCount++;
            } else if (stock.compareTo(reorder) <= 0) {
                lowStockCount++;
            }

            if (par.compareTo(BigDecimal.ZERO) > 0 && stock.compareTo(par) < 0) {
                parBreachedCount++;
            }
        }

        // Expiring batches in next 7 days
        LocalDate expiryThreshold = LocalDate.now().plusDays(7);
        long expiringCount = stockBatchRepository.findByCompany(company).stream()
                .filter(b -> b.getCurrentQuantity().compareTo(BigDecimal.ZERO) > 0)
                .filter(b -> b.getExpiryDate() != null && !b.getExpiryDate().isAfter(expiryThreshold))
                .count();

        return ResponseEntity.ok(Map.of(
                "totalIngredients", ingredients.size(),
                "totalValuation", totalValuation,
                "lowStockCount", lowStockCount,
                "outOfStockCount", outOfStockCount,
                "parBreachedCount", parBreachedCount,
                "expiringCount", expiringCount
        ));
    }

    // ==========================================
    // PHASE 1: ALERTS & 1-CLICK AUTO-PO GENERATION
    // ==========================================

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        List<Ingredient> ingredients = ingredientRepository.findByCompany(company);
        List<Map<String, Object>> lowStockItems = new ArrayList<>();

        for (Ingredient ing : ingredients) {
            BigDecimal stock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal reorder = ing.getReorderLevel() != null ? ing.getReorderLevel() : BigDecimal.ZERO;
            BigDecimal par = ing.getParLevel() != null ? ing.getParLevel() : BigDecimal.ZERO;

            boolean isLow = stock.compareTo(reorder) <= 0 || (par.compareTo(BigDecimal.ZERO) > 0 && stock.compareTo(par) < 0);
            if (isLow) {
                BigDecimal needed = par.compareTo(BigDecimal.ZERO) > 0 
                        ? par.subtract(stock)
                        : reorder.subtract(stock).add(BigDecimal.ONE);
                if (needed.compareTo(BigDecimal.ZERO) <= 0) needed = BigDecimal.ONE;

                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("id", ing.getId());
                itemMap.put("name", ing.getName());
                itemMap.put("unit", ing.getUnit());
                itemMap.put("stockLevel", stock);
                itemMap.put("reorderLevel", reorder);
                itemMap.put("parLevel", par);
                itemMap.put("costPerUnit", ing.getCostPerUnit());
                itemMap.put("neededQuantity", needed);
                itemMap.put("storageZone", ing.getStorageZone());
                itemMap.put("isCritical", stock.compareTo(BigDecimal.ZERO) <= 0);
                if (ing.getPreferredVendor() != null) {
                    itemMap.put("vendorId", ing.getPreferredVendor().getId());
                    itemMap.put("vendorName", ing.getPreferredVendor().getName());
                } else {
                    itemMap.put("vendorId", null);
                    itemMap.put("vendorName", "Unassigned Vendor");
                }
                lowStockItems.add(itemMap);
            }
        }

        // Expiring batches
        LocalDate threshold = LocalDate.now().plusDays(7);
        List<StockBatch> batches = stockBatchRepository.findByCompany(company);
        List<Map<String, Object>> expiringBatches = batches.stream()
                .filter(b -> b.getCurrentQuantity().compareTo(BigDecimal.ZERO) > 0)
                .filter(b -> b.getExpiryDate() != null && !b.getExpiryDate().isAfter(threshold))
                .sorted(Comparator.comparing(StockBatch::getExpiryDate))
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", b.getId());
                    map.put("ingredientName", b.getIngredient() != null ? b.getIngredient().getName() : "Item");
                    map.put("batchNumber", "BATCH-" + b.getId());
                    map.put("currentQuantity", b.getCurrentQuantity());
                    map.put("unit", b.getIngredient() != null ? b.getIngredient().getUnit() : "kg");
                    map.put("expiryDate", b.getExpiryDate());
                    long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), b.getExpiryDate());
                    map.put("daysRemaining", days);
                    map.put("isExpired", days < 0);
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "lowStockCount", lowStockItems.size(),
                "expiringCount", expiringBatches.size(),
                "lowStockItems", lowStockItems,
                "expiringBatches", expiringBatches
        ));
    }

    @PostMapping("/purchases/auto-generate")
    @Transactional
    public ResponseEntity<?> autoGeneratePurchaseOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        List<Ingredient> ingredients = ingredientRepository.findByCompany(company);
        List<Ingredient> depleted = ingredients.stream()
                .filter(ing -> {
                    BigDecimal stock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                    BigDecimal reorder = ing.getReorderLevel() != null ? ing.getReorderLevel() : BigDecimal.ZERO;
                    BigDecimal par = ing.getParLevel() != null ? ing.getParLevel() : BigDecimal.ZERO;
                    return stock.compareTo(reorder) <= 0 || (par.compareTo(BigDecimal.ZERO) > 0 && stock.compareTo(par) < 0);
                })
                .collect(Collectors.toList());

        if (depleted.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "All ingredients are currently well-stocked. No purchase orders needed.", "generatedCount", 0));
        }

        // Group depleted ingredients by vendor
        List<Vendor> allVendors = vendorRepository.findByCompany(company);
        Vendor defaultVendor = allVendors.stream().findFirst().orElse(null);

        Map<Long, List<Ingredient>> vendorGroup = new HashMap<>();
        for (Ingredient ing : depleted) {
            Vendor v = ing.getPreferredVendor() != null ? ing.getPreferredVendor() : defaultVendor;
            if (v != null) {
                vendorGroup.computeIfAbsent(v.getId(), k -> new ArrayList<>()).add(ing);
            }
        }

        if (vendorGroup.isEmpty() && defaultVendor == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No vendors registered. Please create at least one vendor first."));
        }

        List<PurchaseOrder> createdPOs = new ArrayList<>();
        long timestamp = System.currentTimeMillis() % 100000;

        for (Map.Entry<Long, List<Ingredient>> entry : vendorGroup.entrySet()) {
            Vendor vendor = vendorRepository.findById(entry.getKey()).orElse(defaultVendor);
            if (vendor == null) continue;

            PurchaseOrder po = new PurchaseOrder();
            po.setCompany(company);
            po.setVendor(vendor);
            po.setPoNumber("PO-AUTO-" + timestamp + "-" + vendor.getId());
            po.setInvoiceNumber("AUTO-RESTOCK-" + timestamp);
            po.setStatus("Draft");
            po.setInvoiceDate(LocalDate.now());
            po.setExpectedDeliveryDate(LocalDate.now().plusDays(2));
            po.setNotes("Automated restocking Purchase Order generated from target PAR levels");

            BigDecimal totalAmount = BigDecimal.ZERO;
            List<PurchaseOrderItem> items = new ArrayList<>();

            for (Ingredient ing : entry.getValue()) {
                BigDecimal stock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                BigDecimal par = ing.getParLevel() != null ? ing.getParLevel() : BigDecimal.ZERO;
                BigDecimal reorder = ing.getReorderLevel() != null ? ing.getReorderLevel() : BigDecimal.ZERO;

                BigDecimal needed = par.compareTo(BigDecimal.ZERO) > 0 
                        ? par.subtract(stock)
                        : reorder.subtract(stock).add(BigDecimal.ONE);
                if (needed.compareTo(BigDecimal.ZERO) <= 0) needed = BigDecimal.ONE;

                PurchaseOrderItem poi = new PurchaseOrderItem();
                poi.setPurchaseOrder(po);
                poi.setIngredient(ing);
                poi.setQuantityOrdered(needed);
                poi.setQuantityReceived(BigDecimal.ZERO);
                poi.setUnit(ing.getUnit());
                poi.setUnitCost(ing.getCostPerUnit());

                BigDecimal lineTotal = needed.multiply(ing.getCostPerUnit());
                totalAmount = totalAmount.add(lineTotal);
                items.add(poi);
            }

            po.setTotalAmount(totalAmount);
            po.setItems(items);
            PurchaseOrder savedPo = purchaseOrderRepository.save(po);
            createdPOs.add(savedPo);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Successfully generated " + createdPOs.size() + " draft purchase order(s)",
                "generatedCount", createdPOs.size(),
                "purchaseOrders", createdPOs.stream().map(PurchaseOrder::getId).collect(Collectors.toList())
        ));
    }

    // ==========================================
    // PHASE 2: VARIANCE & MENU ENGINEERING MATRIX
    // ==========================================

    @GetMapping("/analytics/variance")
    public ResponseEntity<?> getFoodCostVariance() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        List<Ingredient> ingredients = ingredientRepository.findByCompany(company);
        List<RecipeItem> allRecipeItems = recipeItemRepository.findAll();
        List<CustomerOrder> orders = customerOrderRepository.findByCompany(company);

        // Theoretical consumption: sum(dish quantity * recipe item grammage)
        Map<Long, BigDecimal> theoreticalMap = new HashMap<>();
        for (CustomerOrder order : orders) {
            if ("Cancelled".equalsIgnoreCase(order.getStatus())) continue;
            if (order.getItems() != null) {
                for (OrderItem oi : order.getItems()) {
                    if (oi.getDish() != null) {
                        Long dishId = oi.getDish().getId();
                        int qty = oi.getQuantity();
                        for (RecipeItem ri : allRecipeItems) {
                            if (ri.getDish() != null && ri.getDish().getId().equals(dishId) && ri.getIngredient() != null) {
                                BigDecimal portion = ri.getQuantityRequired() != null ? ri.getQuantityRequired() : BigDecimal.ZERO;
                                BigDecimal converted = inventoryService.convertUnit(portion, ri.getUnit(), ri.getIngredient().getUnit());
                                BigDecimal used = converted.multiply(new BigDecimal(qty));
                                theoreticalMap.merge(ri.getIngredient().getId(), used, BigDecimal::add);
                            }
                        }
                    }
                }
            }
        }

        // Actual movement usage (ORDER_DEDUCTION + WASTE)
        List<StockMovement> movements = stockMovementRepository.findByCompanyOrderByCreatedAtDesc(company);
        Map<Long, BigDecimal> actualMap = new HashMap<>();
        for (StockMovement sm : movements) {
            if ("ORDER_DEDUCTION".equalsIgnoreCase(sm.getMovementType()) || "WASTE".equalsIgnoreCase(sm.getMovementType())) {
                if (sm.getIngredient() != null) {
                    actualMap.merge(sm.getIngredient().getId(), sm.getQuantity().abs(), BigDecimal::add);
                }
            }
        }

        List<Map<String, Object>> varianceItems = new ArrayList<>();
        BigDecimal totalTheoreticalCost = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;

        for (Ingredient ing : ingredients) {
            BigDecimal theoQty = theoreticalMap.getOrDefault(ing.getId(), BigDecimal.ZERO);
            BigDecimal actQty = actualMap.getOrDefault(ing.getId(), BigDecimal.ZERO);
            BigDecimal varQty = actQty.subtract(theoQty);
            BigDecimal unitCost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            BigDecimal varCost = varQty.multiply(unitCost);

            BigDecimal theoCost = theoQty.multiply(unitCost);
            BigDecimal actCost = actQty.multiply(unitCost);

            totalTheoreticalCost = totalTheoreticalCost.add(theoCost);
            totalActualCost = totalActualCost.add(actCost);

            double pct = theoQty.compareTo(BigDecimal.ZERO) > 0 
                    ? (varQty.doubleValue() / theoQty.doubleValue()) * 100.0 
                    : (actQty.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0);

            String status = "Balanced";
            if (pct > 5.0) status = "Over-Portioning / Spoilage";
            else if (pct < -5.0) status = "Under-Portioning";

            Map<String, Object> vMap = new HashMap<>();
            vMap.put("id", ing.getId());
            vMap.put("name", ing.getName());
            vMap.put("unit", ing.getUnit());
            vMap.put("costPerUnit", unitCost);
            vMap.put("theoreticalQty", theoQty.setScale(2, RoundingMode.HALF_UP));
            vMap.put("actualQty", actQty.setScale(2, RoundingMode.HALF_UP));
            vMap.put("varianceQty", varQty.setScale(2, RoundingMode.HALF_UP));
            vMap.put("variancePercent", Math.round(pct * 10.0) / 10.0);
            vMap.put("varianceCost", varCost.setScale(2, RoundingMode.HALF_UP));
            vMap.put("status", status);

            varianceItems.add(vMap);
        }

        varianceItems.sort((a, b) -> ((BigDecimal) b.get("varianceCost")).compareTo((BigDecimal) a.get("varianceCost")));

        BigDecimal netVarianceCost = totalActualCost.subtract(totalTheoreticalCost);
        double overallVariancePct = totalTheoreticalCost.compareTo(BigDecimal.ZERO) > 0 
                ? (netVarianceCost.doubleValue() / totalTheoreticalCost.doubleValue()) * 100.0 
                : 0.0;

        return ResponseEntity.ok(Map.of(
                "totalTheoreticalCost", totalTheoreticalCost.setScale(2, RoundingMode.HALF_UP),
                "totalActualCost", totalActualCost.setScale(2, RoundingMode.HALF_UP),
                "netVarianceCost", netVarianceCost.setScale(2, RoundingMode.HALF_UP),
                "overallVariancePct", Math.round(overallVariancePct * 10.0) / 10.0,
                "items", varianceItems
        ));
    }

    @GetMapping("/analytics/menu-matrix")
    public ResponseEntity<?> getMenuEngineeringMatrix() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        List<Dish> dishes = dishRepository.findByCompany(company);
        List<RecipeItem> allRecipeItems = recipeItemRepository.findAll();
        List<CustomerOrder> orders = customerOrderRepository.findByCompany(company);

        // Sales volume per dish
        Map<Long, Integer> volumeMap = new HashMap<>();
        for (CustomerOrder o : orders) {
            if ("Cancelled".equalsIgnoreCase(o.getStatus())) continue;
            if (o.getItems() != null) {
                for (OrderItem oi : o.getItems()) {
                    if (oi.getDish() != null) {
                        volumeMap.merge(oi.getDish().getId(), oi.getQuantity(), Integer::sum);
                    }
                }
            }
        }

        List<Map<String, Object>> dishStats = new ArrayList<>();
        double totalVolume = 0;
        double totalMargin = 0;

        for (Dish dish : dishes) {
            double price = dish.getPrice() != null ? dish.getPrice().doubleValue() : 0.0;
            BigDecimal recipeCost = BigDecimal.ZERO;

            for (RecipeItem ri : allRecipeItems) {
                if (ri.getDish() != null && ri.getDish().getId().equals(dish.getId()) && ri.getIngredient() != null) {
                    BigDecimal portion = ri.getQuantityRequired() != null ? ri.getQuantityRequired() : BigDecimal.ZERO;
                    BigDecimal unitCost = ri.getIngredient().getCostPerUnit() != null ? ri.getIngredient().getCostPerUnit() : BigDecimal.ZERO;
                    BigDecimal converted = inventoryService.convertUnit(portion, ri.getUnit(), ri.getIngredient().getUnit());
                    recipeCost = recipeCost.add(converted.multiply(unitCost));
                }
            }

            double rCost = recipeCost.doubleValue();
            double margin = price - rCost;
            double marginPct = price > 0 ? (margin / price) * 100.0 : 0.0;
            int volume = volumeMap.getOrDefault(dish.getId(), 0);

            totalVolume += volume;
            totalMargin += margin;

            Map<String, Object> stat = new HashMap<>();
            stat.put("dishId", dish.getId());
            stat.put("dishName", dish.getName());
            stat.put("categoryName", dish.getCategory() != null ? dish.getCategory().getName() : "General");
            stat.put("price", price);
            stat.put("recipeCost", Math.round(rCost * 100.0) / 100.0);
            stat.put("grossMargin", Math.round(margin * 100.0) / 100.0);
            stat.put("marginPercent", Math.round(marginPct * 10.0) / 10.0);
            stat.put("volumeSold", volume);
            dishStats.add(stat);
        }

        int count = dishStats.isEmpty() ? 1 : dishStats.size();
        double avgVolume = totalVolume / count;
        double avgMargin = totalMargin / count;

        int stars = 0, plowhorses = 0, puzzles = 0, dogs = 0;

        for (Map<String, Object> stat : dishStats) {
            double m = ((Number) stat.get("grossMargin")).doubleValue();
            int v = ((Number) stat.get("volumeSold")).intValue();

            String classification;
            String advice;
            if (v >= avgVolume && m >= avgMargin) {
                classification = "STAR";
                advice = "High profit & popularity. Protect recipe consistency and highlight in menu.";
                stars++;
            } else if (v >= avgVolume && m < avgMargin) {
                classification = "PLOWHORSE";
                advice = "High volume but lower margin. Renegotiate ingredient costs or slightly increase price.";
                plowhorses++;
            } else if (v < avgVolume && m >= avgMargin) {
                classification = "PUZZLE";
                advice = "High profit but low sales. Feature as Today's Special or improve presentation.";
                puzzles++;
            } else {
                classification = "DOG";
                advice = "Low popularity & margin. Candidate for recipe overhaul or removal.";
                dogs++;
            }
            stat.put("classification", classification);
            stat.put("strategicAdvice", advice);
        }

        return ResponseEntity.ok(Map.of(
                "averageVolume", Math.round(avgVolume * 10.0) / 10.0,
                "averageMargin", Math.round(avgMargin * 100.0) / 100.0,
                "counts", Map.of("stars", stars, "plowhorses", plowhorses, "puzzles", puzzles, "dogs", dogs),
                "dishes", dishStats
        ));
    }

    // ==========================================
    // PHASE 3: INTER-BRANCH STOCK TRANSFERS (ITO)
    // ==========================================

    @GetMapping("/transfers")
    public ResponseEntity<?> getTransfers() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(stockTransferRepository.findByCompanyOrderByCreatedAtDesc(company));
    }

    @PostMapping("/transfers")
    @Transactional
    public ResponseEntity<?> createTransfer(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        if (!payload.containsKey("destinationBranchId") || !payload.containsKey("items")) {
            return ResponseEntity.badRequest().body(Map.of("message", "destinationBranchId and items are required"));
        }

        StockTransfer transfer = new StockTransfer();
        transfer.setCompany(company);
        transfer.setTransferNumber("ITO-" + (System.currentTimeMillis() % 1000000));
        transfer.setStatus("Pending Approval");
        transfer.setNotes(payload.containsKey("notes") && payload.get("notes") != null ? payload.get("notes").toString() : "");

        if (payload.containsKey("sourceBranchId") && payload.get("sourceBranchId") != null && !payload.get("sourceBranchId").toString().isEmpty()) {
            Long sId = Long.parseLong(payload.get("sourceBranchId").toString());
            branchRepository.findById(sId).ifPresent(transfer::setSourceBranch);
        }

        Long dId = Long.parseLong(payload.get("destinationBranchId").toString());
        var destBranch = branchRepository.findById(dId).orElse(null);
        if (destBranch == null) return ResponseEntity.badRequest().body(Map.of("message", "Destination branch not found"));
        transfer.setDestinationBranch(destBranch);

        List<StockTransferItem> items = new ArrayList<>();
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) payload.get("items");

        for (Map<String, Object> rItem : rawItems) {
            Long ingId = Long.parseLong(rItem.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
            if (ing == null) continue;

            BigDecimal qty = new BigDecimal(rItem.get("quantity").toString());
            StockTransferItem ti = new StockTransferItem();
            ti.setTransfer(transfer);
            ti.setIngredient(ing);
            ti.setQuantityRequested(qty);
            ti.setQuantityDispatched(qty);
            ti.setQuantityReceived(BigDecimal.ZERO);
            ti.setUnit(ing.getUnit());
            ti.setCostPerUnit(ing.getCostPerUnit());
            items.add(ti);
        }

        transfer.setItems(items);
        StockTransfer saved = stockTransferRepository.save(transfer);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/transfers/{id}/dispatch")
    @Transactional
    public ResponseEntity<?> dispatchTransfer(@PathVariable Long id) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var transferOpt = stockTransferRepository.findById(id);
        if (transferOpt.isEmpty()) return ResponseEntity.notFound().build();

        StockTransfer transfer = transferOpt.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        // Deduct items from source branch / commissary
        for (StockTransferItem item : transfer.getItems()) {
            Ingredient ing = item.getIngredient();
            BigDecimal prevStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal newStock = prevStock.subtract(item.getQuantityDispatched());
            ing.setStockLevel(newStock);
            ingredientRepository.save(ing);

            inventoryService.recordMovement(
                    company,
                    transfer.getSourceBranch(),
                    ing,
                    "TRANSFER_OUT",
                    item.getQuantityDispatched().negate(),
                    prevStock,
                    newStock,
                    item.getCostPerUnit(),
                    "TRANSFER",
                    transfer.getTransferNumber(),
                    "Dispatched to " + transfer.getDestinationBranch().getName(),
                    username
            );
        }

        transfer.setStatus("In-Transit");
        transfer.setDispatchedBy(username);
        transfer.setDispatchedAt(LocalDateTime.now());
        stockTransferRepository.save(transfer);

        return ResponseEntity.ok(Map.of("message", "Stock dispatched successfully into transit", "transfer", transfer));
    }

    @PutMapping("/transfers/{id}/receive")
    @Transactional
    public ResponseEntity<?> receiveTransfer(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var transferOpt = stockTransferRepository.findById(id);
        if (transferOpt.isEmpty()) return ResponseEntity.notFound().build();

        StockTransfer transfer = transferOpt.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        for (StockTransferItem item : transfer.getItems()) {
            BigDecimal qtyReceived = item.getQuantityDispatched();
            item.setQuantityReceived(qtyReceived);

            Ingredient ing = item.getIngredient();
            BigDecimal prevStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal newStock = prevStock.add(qtyReceived);
            ing.setStockLevel(newStock);
            ingredientRepository.save(ing);

            // Add StockBatch at destination
            StockBatch batch = new StockBatch();
            batch.setCompany(company);
            batch.setBranch(transfer.getDestinationBranch());
            batch.setIngredient(ing);
            batch.setInitialQuantity(qtyReceived);
            batch.setCurrentQuantity(qtyReceived);
            batch.setCostPerUnit(item.getCostPerUnit());
            stockBatchRepository.save(batch);

            inventoryService.recordMovement(
                    company,
                    transfer.getDestinationBranch(),
                    ing,
                    "TRANSFER_IN",
                    qtyReceived,
                    prevStock,
                    newStock,
                    item.getCostPerUnit(),
                    "TRANSFER",
                    transfer.getTransferNumber(),
                    "Received transfer from " + (transfer.getSourceBranch() != null ? transfer.getSourceBranch().getName() : "Commissary"),
                    username
            );
        }

        transfer.setStatus("Received");
        transfer.setReceivedBy(username);
        transfer.setReceivedAt(LocalDateTime.now());
        stockTransferRepository.save(transfer);

        return ResponseEntity.ok(Map.of("message", "Stock received and updated successfully", "transfer", transfer));
    }

    // ==========================================
    // PHASE 4: PHYSICAL STOCK AUDITING & CYCLE COUNTS
    // ==========================================

    @GetMapping("/audits")
    public ResponseEntity<?> getAudits() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(stockAuditRepository.findByCompanyOrderByCreatedAtDesc(company));
    }

    @PostMapping("/audits")
    @Transactional
    public ResponseEntity<?> createAudit(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        String zone = payload.containsKey("storageZone") && payload.get("storageZone") != null
                ? payload.get("storageZone").toString()
                : "All";

        StockAudit audit = new StockAudit();
        audit.setCompany(company);
        audit.setAuditNumber("AUD-" + (System.currentTimeMillis() % 1000000));
        audit.setStorageZone(zone);
        audit.setStatus("Draft");
        audit.setAuditedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        audit.setNotes(payload.containsKey("notes") && payload.get("notes") != null ? payload.get("notes").toString() : "");

        Long bId = getBranchId();
        if (bId != null) {
            branchRepository.findById(bId).ifPresent(audit::setBranch);
        }

        List<Ingredient> ingredients = ingredientRepository.findByCompany(company);
        if (!"All".equalsIgnoreCase(zone)) {
            ingredients = ingredients.stream()
                    .filter(i -> zone.equalsIgnoreCase(i.getStorageZone()))
                    .collect(Collectors.toList());
        }

        List<StockAuditItem> items = new ArrayList<>();
        for (Ingredient ing : ingredients) {
            StockAuditItem item = new StockAuditItem();
            item.setAudit(audit);
            item.setIngredient(ing);
            item.setSystemQuantity(ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO);
            item.setPhysicalQuantity(item.getSystemQuantity());
            item.setVarianceQuantity(BigDecimal.ZERO);
            item.setUnit(ing.getUnit());
            item.setUnitCost(ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO);
            item.setVarianceValue(BigDecimal.ZERO);
            items.add(item);
        }

        audit.setItems(items);
        StockAudit saved = stockAuditRepository.save(audit);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/audits/{id}/reconcile")
    @Transactional
    public ResponseEntity<?> reconcileAudit(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        var auditOpt = stockAuditRepository.findById(id);
        if (auditOpt.isEmpty()) return ResponseEntity.notFound().build();

        StockAudit audit = auditOpt.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        List<Map<String, Object>> countUpdates = (List<Map<String, Object>>) payload.get("items");
        Map<Long, Map<String, Object>> updateMap = new HashMap<>();
        if (countUpdates != null) {
            for (Map<String, Object> cu : countUpdates) {
                updateMap.put(Long.parseLong(cu.get("id").toString()), cu);
            }
        }

        BigDecimal totalVarianceValue = BigDecimal.ZERO;

        for (StockAuditItem item : audit.getItems()) {
            if (updateMap.containsKey(item.getId())) {
                Map<String, Object> data = updateMap.get(item.getId());
                BigDecimal phys = new BigDecimal(data.get("physicalQuantity").toString());
                item.setPhysicalQuantity(phys);

                BigDecimal varQty = phys.subtract(item.getSystemQuantity());
                item.setVarianceQuantity(varQty);

                BigDecimal varVal = varQty.multiply(item.getUnitCost());
                item.setVarianceValue(varVal);
                totalVarianceValue = totalVarianceValue.add(varVal);

                if (data.containsKey("discrepancyReason") && data.get("discrepancyReason") != null) {
                    item.setDiscrepancyReason(data.get("discrepancyReason").toString());
                }

                // If variance exists, adjust ingredient stock and record reconciling movement
                if (varQty.compareTo(BigDecimal.ZERO) != 0) {
                    Ingredient ing = item.getIngredient();
                    BigDecimal prevStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                    ing.setStockLevel(phys);
                    ingredientRepository.save(ing);

                    inventoryService.recordMovement(
                            company,
                            audit.getBranch(),
                            ing,
                            "AUDIT_RECONCILIATION",
                            varQty,
                            prevStock,
                            phys,
                            item.getUnitCost(),
                            "STOCK_AUDIT",
                            audit.getAuditNumber(),
                            item.getDiscrepancyReason() != null ? item.getDiscrepancyReason() : "Reconciled via physical audit count",
                            username
                    );
                }
            }
        }

        audit.setTotalVarianceValue(totalVarianceValue);
        audit.setStatus("Reconciled");
        stockAuditRepository.save(audit);

        return ResponseEntity.ok(Map.of("message", "Stock audit successfully reconciled and inventory updated", "audit", audit));
    }

    // ==========================================
    // PHASE 5: BARCODE QUICK LOOKUP
    // ==========================================

    @GetMapping("/barcode/{code}")
    public ResponseEntity<?> getIngredientByBarcode(@PathVariable String code) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        return ingredientRepository.findByCompany(company).stream()
                .filter(i -> code.equalsIgnoreCase(i.getBarcode()))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
