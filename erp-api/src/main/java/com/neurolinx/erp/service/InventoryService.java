package com.neurolinx.erp.service;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class InventoryService {

    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private RecipeItemRepository recipeItemRepository;
    @Autowired private StockBatchRepository stockBatchRepository;
    @Autowired private StockMovementRepository stockMovementRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Autowired private CustomerOrderRepository orderRepository;
    @Autowired private GoodsReceiptRepository goodsReceiptRepository;
    @Autowired private GoodsReceiptItemRepository goodsReceiptItemRepository;
    @Autowired private VendorRepository vendorRepository;

    /**
     * Safe unit conversion supporting:
     * Weight: kg, g, mg
     * Volume: l, litre, liter, ml
     * Count: pcs, piece, pieces, unit, units
     */
    public BigDecimal convertUnit(BigDecimal quantity, String fromUnit, String toUnit) {
        if (quantity == null) return BigDecimal.ZERO;
        if (fromUnit == null || toUnit == null) return quantity;

        String f = fromUnit.trim().toLowerCase();
        String t = toUnit.trim().toLowerCase();

        if (f.equals(t)) return quantity;

        // Normalize synonyms
        if (f.equals("litre") || f.equals("liter")) f = "l";
        if (t.equals("litre") || t.equals("liter")) t = "l";
        if (f.equals("gram") || f.equals("grams")) f = "g";
        if (t.equals("gram") || t.equals("grams")) t = "g";
        if (f.equals("piece") || f.equals("pieces") || f.equals("unit") || f.equals("units")) f = "pcs";
        if (t.equals("piece") || t.equals("pieces") || t.equals("unit") || t.equals("units")) t = "pcs";

        if (f.equals(t)) return quantity;

        // Weight conversions
        if (f.equals("g") && t.equals("kg")) {
            return quantity.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        }
        if (f.equals("kg") && t.equals("g")) {
            return quantity.multiply(new BigDecimal("1000"));
        }
        if (f.equals("mg") && t.equals("g")) {
            return quantity.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        }
        if (f.equals("mg") && t.equals("kg")) {
            return quantity.divide(new BigDecimal("1000000"), 6, RoundingMode.HALF_UP);
        }
        if (f.equals("g") && t.equals("mg")) {
            return quantity.multiply(new BigDecimal("1000"));
        }
        if (f.equals("kg") && t.equals("mg")) {
            return quantity.multiply(new BigDecimal("1000000"));
        }

        // Volume conversions
        if (f.equals("ml") && t.equals("l")) {
            return quantity.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        }
        if (f.equals("l") && t.equals("ml")) {
            return quantity.multiply(new BigDecimal("1000"));
        }

        // If incompatible conversion, return original quantity to avoid blocking operations, or handle gracefully
        return quantity;
    }

    /**
     * Record a transaction in the auditable stock ledger
     */
    @Transactional
    public StockMovement recordMovement(
            Company company,
            Branch branch,
            Ingredient ingredient,
            String movementType,
            BigDecimal quantity,
            BigDecimal previousStock,
            BigDecimal newStock,
            BigDecimal unitCost,
            String referenceType,
            String referenceId,
            String reason,
            String createdByName
    ) {
        StockMovement movement = new StockMovement();
        movement.setCompany(company);
        movement.setBranch(branch != null ? branch : (ingredient != null ? ingredient.getBranch() : null));
        movement.setIngredient(ingredient);
        movement.setMovementType(movementType);
        movement.setQuantity(quantity);
        movement.setPreviousStock(previousStock != null ? previousStock : BigDecimal.ZERO);
        movement.setNewStock(newStock != null ? newStock : BigDecimal.ZERO);
        movement.setUnit(ingredient != null ? ingredient.getUnit() : "kg");
        movement.setUnitCost(unitCost != null ? unitCost : (ingredient != null ? ingredient.getCostPerUnit() : BigDecimal.ZERO));
        if (unitCost != null && quantity != null) {
            movement.setTotalCost(unitCost.multiply(quantity.abs()));
        } else {
            movement.setTotalCost(BigDecimal.ZERO);
        }
        movement.setReferenceType(referenceType);
        movement.setReferenceId(referenceId);
        movement.setReason(reason);
        movement.setCreatedByName(createdByName != null ? createdByName : "System");
        movement.setCreatedAt(LocalDateTime.now());

        return stockMovementRepository.save(movement);
    }

    /**
     * Automatic stock deduction for eligible customer orders based on dish recipes.
     * Idempotent: Deducts stock only once per order.
     */
    @Transactional
    public void deductInventoryForOrder(CustomerOrder order, String username) {
        if (order == null || Boolean.TRUE.equals(order.getInventoryDeducted())) {
            return;
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            order.setInventoryDeducted(true);
            orderRepository.save(order);
            return;
        }

        for (OrderItem item : order.getItems()) {
            if (item.getDish() != null) {
                List<RecipeItem> recipes = recipeItemRepository.findByDishId(item.getDish().getId());
                int qtyOrdered = item.getQuantity() != null ? item.getQuantity() : 1;

                for (RecipeItem r : recipes) {
                    Ingredient ing = r.getIngredient();
                    if (ing != null && r.getQuantityRequired() != null) {
                        BigDecimal perServing = r.getQuantityRequired();
                        BigDecimal totalNeededInRecipeUnit = perServing.multiply(new BigDecimal(qtyOrdered));
                        BigDecimal totalNeeded = convertUnit(totalNeededInRecipeUnit, r.getUnit(), ing.getUnit());

                        BigDecimal currentStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                        BigDecimal newStock = currentStock.subtract(totalNeeded);

                        ing.setStockLevel(newStock);
                        ingredientRepository.save(ing);

                        recordMovement(
                                order.getCompany(),
                                order.getBranch(),
                                ing,
                                "SALE_CONSUMPTION",
                                totalNeeded.negate(),
                                currentStock,
                                newStock,
                                ing.getCostPerUnit(),
                                "CUSTOMER_ORDER",
                                order.getOrderNumber() != null ? order.getOrderNumber() : ("Order #" + order.getId()),
                                "Sold " + qtyOrdered + "x " + item.getDish().getName(),
                                username != null ? username : "POS"
                        );
                    }
                }
            }
        }

        order.setInventoryDeducted(true);
        orderRepository.save(order);
    }

    /**
     * Restores inventory when an order is cancelled or refunded.
     * Idempotent: Restores stock only once.
     */
    @Transactional
    public void restoreInventoryForOrder(CustomerOrder order, String username) {
        if (order == null || !Boolean.TRUE.equals(order.getInventoryDeducted()) || Boolean.TRUE.equals(order.getInventoryRestored())) {
            return;
        }

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getDish() != null) {
                    List<RecipeItem> recipes = recipeItemRepository.findByDishId(item.getDish().getId());
                    int qtyOrdered = item.getQuantity() != null ? item.getQuantity() : 1;

                    for (RecipeItem r : recipes) {
                        Ingredient ing = r.getIngredient();
                        if (ing != null && r.getQuantityRequired() != null) {
                            BigDecimal perServing = r.getQuantityRequired();
                            BigDecimal totalNeededInRecipeUnit = perServing.multiply(new BigDecimal(qtyOrdered));
                            BigDecimal totalRestored = convertUnit(totalNeededInRecipeUnit, r.getUnit(), ing.getUnit());

                            BigDecimal currentStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
                            BigDecimal newStock = currentStock.add(totalRestored);

                            ing.setStockLevel(newStock);
                            ingredientRepository.save(ing);

                            recordMovement(
                                    order.getCompany(),
                                    order.getBranch(),
                                    ing,
                                    "ORDER_CANCELLED_RESTORE",
                                    totalRestored,
                                    currentStock,
                                    newStock,
                                    ing.getCostPerUnit(),
                                    "CUSTOMER_ORDER",
                                    order.getOrderNumber() != null ? order.getOrderNumber() : ("Order #" + order.getId()),
                                    "Order Cancelled: Restored ingredients for " + qtyOrdered + "x " + item.getDish().getName(),
                                    username != null ? username : "System"
                            );
                        }
                    }
                }
            }
        }

        order.setInventoryRestored(true);
        orderRepository.save(order);
    }

    /**
     * Complete Goods Receipt / Receive Stock Workflow:
     * Validates receipt, increases stock, updates PO item received quantities, logs batches & ledger.
     */
    @Transactional
    public Map<String, Object> receiveStock(
            PurchaseOrder po,
            String invoiceNumber,
            LocalDate invoiceDate,
            LocalDate receiptDate,
            BigDecimal amountPaid,
            List<Map<String, Object>> receivedItems,
            String username
    ) {
        return receiveStock(po, invoiceNumber, invoiceDate, receiptDate, amountPaid, "CASH", null, receivedItems, username);
    }

    @Transactional
    public Map<String, Object> receiveStock(
            PurchaseOrder po,
            String invoiceNumber,
            LocalDate invoiceDate,
            LocalDate receiptDate,
            BigDecimal amountPaid,
            String paymentMethod,
            String paymentReference,
            List<Map<String, Object>> receivedItems,
            String username
    ) {
        return receiveStock(po, invoiceNumber, invoiceDate, receiptDate, amountPaid, paymentMethod, paymentReference, LocalDate.now(), receivedItems, username);
    }

    @Transactional
    public Map<String, Object> receiveStock(
            PurchaseOrder po,
            String invoiceNumber,
            LocalDate invoiceDate,
            LocalDate receiptDate,
            BigDecimal amountPaid,
            String paymentMethod,
            String paymentReference,
            LocalDate paymentDate,
            List<Map<String, Object>> receivedItems,
            String username
    ) {
        return receiveStock(po, invoiceNumber, invoiceDate, receiptDate, amountPaid, paymentMethod, paymentReference, paymentDate, null, null, null, receivedItems, username);
    }

    @Transactional
    public Map<String, Object> receiveStock(
            PurchaseOrder po,
            String invoiceNumber,
            LocalDate invoiceDate,
            LocalDate receiptDate,
            BigDecimal amountPaid,
            String paymentMethod,
            String paymentReference,
            LocalDate paymentDate,
            BigDecimal invoiceTotal,
            BigDecimal taxableAmount,
            BigDecimal taxAmount,
            List<Map<String, Object>> receivedItems,
            String username
    ) {
        if (po == null) {
            throw new IllegalArgumentException("Purchase order is required");
        }

        if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Invoice number is required");
        }
        String cleanInvoice = invoiceNumber.trim();

        // Prevent accidental duplicate invoice submissions for the same Purchase Order
        if (goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(po, cleanInvoice)) {
            throw new IllegalArgumentException("Invoice #" + cleanInvoice + " has already been processed for Purchase Order #" + po.getPoNumber() + ". Duplicate submission prevented.");
        }

        if (receivedItems == null || receivedItems.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one received item");
        }

        boolean hasPositiveQuantity = false;
        for (Map<String, Object> itemData : receivedItems) {
            if (itemData.containsKey("quantity") && itemData.get("quantity") != null) {
                BigDecimal q = new BigDecimal(itemData.get("quantity").toString());
                if (q.compareTo(BigDecimal.ZERO) > 0) {
                    hasPositiveQuantity = true;
                    break;
                }
            }
        }
        if (!hasPositiveQuantity) {
            throw new IllegalArgumentException("Please enter a received quantity greater than 0 for at least one item.");
        }

        // Validate receiving quantities against remaining ordered quantities
        for (Map<String, Object> itemData : receivedItems) {
            Long ingId = Long.parseLong(itemData.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid ingredient ID: " + ingId));

            BigDecimal qtyReceived = new BigDecimal(itemData.get("quantity").toString());
            if (qtyReceived.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            PurchaseOrderItem matchingPoi = null;
            if (po.getItems() != null) {
                for (PurchaseOrderItem poi : po.getItems()) {
                    if (poi.getIngredient() != null && poi.getIngredient().getId().equals(ing.getId())) {
                        matchingPoi = poi;
                        break;
                    }
                }
            }

            if (matchingPoi == null) {
                throw new IllegalArgumentException("Ingredient " + ing.getName() + " does not belong to Purchase Order #" + po.getPoNumber());
            }

            String itemUnit = itemData.containsKey("unit") && itemData.get("unit") != null
                    ? itemData.get("unit").toString()
                    : matchingPoi.getUnit();
            BigDecimal convertedQty = convertUnit(qtyReceived, itemUnit, matchingPoi.getUnit());

            BigDecimal alreadyReceived = matchingPoi.getQuantityReceived() != null ? matchingPoi.getQuantityReceived() : BigDecimal.ZERO;
            BigDecimal remaining = matchingPoi.getQuantityOrdered().subtract(alreadyReceived);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

            if (convertedQty.compareTo(remaining) > 0) {
                throw new IllegalArgumentException("Receiving quantity (" + qtyReceived + " " + itemUnit + ") for "
                        + ing.getName() + " exceeds the remaining ordered quantity (" + remaining + " " + matchingPoi.getUnit() + ").");
            }
        }

        // Initialize Goods Receipt Header
        GoodsReceipt goodsReceipt = new GoodsReceipt();
        goodsReceipt.setReceiptNumber("GRN-" + System.currentTimeMillis());
        goodsReceipt.setInvoiceNumber(cleanInvoice);
        goodsReceipt.setInvoiceDate(invoiceDate != null ? invoiceDate : LocalDate.now());
        goodsReceipt.setReceiptDate(receiptDate != null ? receiptDate : LocalDate.now());
        goodsReceipt.setPurchaseOrder(po);
        goodsReceipt.setVendor(po.getVendor());
        goodsReceipt.setCompany(po.getCompany());
        goodsReceipt.setBranch(po.getBranch());
        goodsReceipt.setReceivedBy(username != null ? username : "Inventory Manager");
        goodsReceipt.setPaymentMethod(paymentMethod != null ? paymentMethod : "CASH");
        goodsReceipt.setPaymentReference(paymentReference);
        po.setPaymentMethod(paymentMethod != null ? paymentMethod : "CASH");

        BigDecimal totalInwardAmount = BigDecimal.ZERO;
        List<GoodsReceiptItem> receiptItems = new ArrayList<>();

        // Process line items
        for (Map<String, Object> itemData : receivedItems) {
            Long ingId = Long.parseLong(itemData.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId).orElse(null);
            if (ing == null) continue;

            BigDecimal qtyReceived = new BigDecimal(itemData.get("quantity").toString());
            if (qtyReceived.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal unitCost = itemData.containsKey("costPerUnit") && itemData.get("costPerUnit") != null
                    ? new BigDecimal(itemData.get("costPerUnit").toString())
                    : (ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO);

            String itemUnit = itemData.containsKey("unit") && itemData.get("unit") != null
                    ? itemData.get("unit").toString()
                    : ing.getUnit();

            // Convert to ingredient standard unit if needed
            BigDecimal convertedQty = convertUnit(qtyReceived, itemUnit, ing.getUnit());

            // 1. Update ingredient stock level and cost per unit
            BigDecimal prevStock = ing.getStockLevel() != null ? ing.getStockLevel() : BigDecimal.ZERO;
            BigDecimal newStock = prevStock.add(convertedQty);
            ing.setStockLevel(newStock);
            if (unitCost.compareTo(BigDecimal.ZERO) > 0) {
                ing.setCostPerUnit(unitCost);
            }
            ingredientRepository.save(ing);

            // 2. Create StockBatch for FIFO and shelf-life tracking
            StockBatch batch = new StockBatch();
            batch.setCompany(po.getCompany());
            batch.setBranch(po.getBranch());
            batch.setPurchaseOrder(po);
            batch.setIngredient(ing);
            batch.setInitialQuantity(convertedQty);
            batch.setCurrentQuantity(convertedQty);
            batch.setCostPerUnit(unitCost);
            if (itemData.containsKey("expiryDate") && itemData.get("expiryDate") != null && !itemData.get("expiryDate").toString().isEmpty()) {
                batch.setExpiryDate(LocalDate.parse(itemData.get("expiryDate").toString()));
            }
            stockBatchRepository.save(batch);

            // 3. Update quantityReceived on matching PurchaseOrderItem
            PurchaseOrderItem matchingPoi = null;
            BigDecimal previouslyReceived = BigDecimal.ZERO;
            BigDecimal orderedQty = convertedQty;
            if (po.getItems() != null) {
                for (PurchaseOrderItem poi : po.getItems()) {
                    if (poi.getIngredient() != null && poi.getIngredient().getId().equals(ing.getId())) {
                        matchingPoi = poi;
                        previouslyReceived = poi.getQuantityReceived() != null ? poi.getQuantityReceived() : BigDecimal.ZERO;
                        orderedQty = poi.getQuantityOrdered();
                        poi.setQuantityReceived(previouslyReceived.add(convertedQty));
                        purchaseOrderItemRepository.save(poi);
                        break;
                    }
                }
            }

            BigDecimal remainingAfter = orderedQty.subtract(previouslyReceived.add(convertedQty));
            if (remainingAfter.compareTo(BigDecimal.ZERO) < 0) remainingAfter = BigDecimal.ZERO;

            // 4. Create GoodsReceiptItem
            GoodsReceiptItem gri = new GoodsReceiptItem();
            gri.setGoodsReceipt(goodsReceipt);
            gri.setIngredient(ing);
            gri.setQuantityOrdered(orderedQty);
            gri.setQuantityPreviouslyReceived(previouslyReceived);
            gri.setQuantityReceived(convertedQty);
            gri.setQuantityRemaining(remainingAfter);
            gri.setUnitCost(unitCost);
            BigDecimal lineTotal = unitCost.multiply(convertedQty);
            gri.setTotalCost(lineTotal);
            gri.setUnit(ing.getUnit());
            if (itemData.containsKey("expiryDate") && itemData.get("expiryDate") != null && !itemData.get("expiryDate").toString().isEmpty()) {
                gri.setExpiryDate(LocalDate.parse(itemData.get("expiryDate").toString()));
            }
            if (itemData.containsKey("itemCode") && itemData.get("itemCode") != null) {
                gri.setItemCode(itemData.get("itemCode").toString());
            }
            if (itemData.containsKey("invoiceQuantity") && itemData.get("invoiceQuantity") != null) {
                gri.setInvoiceQuantity(new BigDecimal(itemData.get("invoiceQuantity").toString()));
            } else {
                gri.setInvoiceQuantity(convertedQty);
            }
            if (itemData.containsKey("invoiceUnitCost") && itemData.get("invoiceUnitCost") != null) {
                gri.setInvoiceUnitCost(new BigDecimal(itemData.get("invoiceUnitCost").toString()));
            } else {
                gri.setInvoiceUnitCost(unitCost);
            }
            if (itemData.containsKey("taxRate") && itemData.get("taxRate") != null) {
                gri.setTaxRate(new BigDecimal(itemData.get("taxRate").toString()));
            }
            if (itemData.containsKey("taxAmount") && itemData.get("taxAmount") != null) {
                gri.setTaxAmount(new BigDecimal(itemData.get("taxAmount").toString()));
            }
            if (itemData.containsKey("discountAmount") && itemData.get("discountAmount") != null) {
                gri.setDiscountAmount(new BigDecimal(itemData.get("discountAmount").toString()));
            }
            if (itemData.containsKey("mismatchFlag") && itemData.get("mismatchFlag") != null) {
                gri.setMismatchFlag(Boolean.parseBoolean(itemData.get("mismatchFlag").toString()));
            }
            receiptItems.add(gri);

            totalInwardAmount = totalInwardAmount.add(lineTotal);

            // 5. Record auditable Stock Movement entry
            recordMovement(
                    po.getCompany(),
                    po.getBranch(),
                    ing,
                    "PURCHASE_RECEIPT",
                    convertedQty,
                    prevStock,
                    newStock,
                    unitCost,
                    "GOODS_RECEIPT",
                    cleanInvoice,
                    "Inwarded stock via " + goodsReceipt.getReceiptNumber() + " against PO #" + po.getPoNumber() + " (Invoice: " + cleanInvoice + ", Vendor: " + (po.getVendor() != null ? po.getVendor().getName() : "N/A") + ")",
                    username != null ? username : "Inventory Manager"
            );
        }

        // Validate & Calculate Payment Details
        BigDecimal actualPaid = amountPaid != null && amountPaid.compareTo(BigDecimal.ZERO) > 0 ? amountPaid : BigDecimal.ZERO;
        if (actualPaid.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount paid cannot be negative");
        }
        if (actualPaid.compareTo(totalInwardAmount) > 0) {
            throw new IllegalArgumentException("Amount paid (₹" + actualPaid + ") cannot exceed total inward purchase amount (₹" + totalInwardAmount + ")");
        }

        BigDecimal remainingBal = totalInwardAmount.subtract(actualPaid);
        if (remainingBal.compareTo(BigDecimal.ZERO) < 0) remainingBal = BigDecimal.ZERO;

        String payStatus = "Unpaid";
        if (actualPaid.compareTo(BigDecimal.ZERO) > 0) {
            payStatus = actualPaid.compareTo(totalInwardAmount) >= 0 ? "Paid" : "Partially Paid";
        }

        // Save Goods Receipt Header & Payment Info
        goodsReceipt.setTotalAmount(totalInwardAmount);
        goodsReceipt.setInvoiceTotal(invoiceTotal != null ? invoiceTotal : totalInwardAmount);
        goodsReceipt.setTaxableAmount(taxableAmount != null ? taxableAmount : totalInwardAmount);
        goodsReceipt.setTaxAmount(taxAmount != null ? taxAmount : BigDecimal.ZERO);
        goodsReceipt.setAmountPaid(actualPaid);
        goodsReceipt.setRemainingBalance(remainingBal);
        goodsReceipt.setPaymentStatus(payStatus);
        goodsReceipt.setPaymentMethod(paymentMethod != null ? paymentMethod : "CASH");
        goodsReceipt.setPaymentReference(paymentReference);
        goodsReceipt.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        goodsReceipt.setItems(receiptItems);

        // Update PO payment and method
        po.setAmountPaid(po.getAmountPaid().add(actualPaid));
        po.setPaymentMethod(goodsReceipt.getPaymentMethod());

        // Update vendor outstanding balance if there is an unpaid remaining balance
        Vendor vendor = po.getVendor();
        if (vendor != null && remainingBal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal prevVendorBal = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
            vendor.setBalance(prevVendorBal.add(remainingBal));
            vendorRepository.save(vendor);
        }

        // Update PO Invoice Number & Date
        po.setInvoiceNumber(cleanInvoice);
        if (invoiceDate != null) po.setInvoiceDate(invoiceDate);

        // Determine PO status based on ordered vs received quantities
        boolean allFullyReceived = true;
        boolean anyReceived = false;

        if (po.getItems() != null && !po.getItems().isEmpty()) {
            for (PurchaseOrderItem poi : po.getItems()) {
                BigDecimal ordered = poi.getQuantityOrdered() != null ? poi.getQuantityOrdered() : BigDecimal.ZERO;
                BigDecimal rec = poi.getQuantityReceived() != null ? poi.getQuantityReceived() : BigDecimal.ZERO;
                if (rec.compareTo(BigDecimal.ZERO) > 0) {
                    anyReceived = true;
                }
                if (rec.compareTo(ordered) < 0) {
                    allFullyReceived = false;
                }
            }
        }

        if (allFullyReceived) {
            po.setStatus("Received");
            goodsReceipt.setStatus("Completed");
        } else if (anyReceived) {
            po.setStatus("Partially Received");
            goodsReceipt.setStatus("Partially Received");
        }

        purchaseOrderRepository.save(po);
        goodsReceipt = goodsReceiptRepository.save(goodsReceipt);

        Map<String, Object> responseMap = new LinkedHashMap<>();
        responseMap.put("message", "Stock received and inwarded successfully against Invoice " + cleanInvoice);
        responseMap.put("receiptId", goodsReceipt.getId());
        responseMap.put("receiptNumber", goodsReceipt.getReceiptNumber());
        responseMap.put("invoiceNumber", cleanInvoice);
        responseMap.put("purchaseOrderId", po.getId());
        responseMap.put("poNumber", po.getPoNumber());
        responseMap.put("status", po.getStatus());
        responseMap.put("totalAmount", totalInwardAmount);
        responseMap.put("amountPaid", actualPaid);
        responseMap.put("remainingBalance", remainingBal);
        responseMap.put("paymentStatus", payStatus);
        responseMap.put("paymentMethod", goodsReceipt.getPaymentMethod());
        return responseMap;
    }
}
