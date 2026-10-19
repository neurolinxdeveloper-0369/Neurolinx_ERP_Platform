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
        if (po == null) {
            throw new IllegalArgumentException("Purchase order is required");
        }

        if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Invoice number is required");
        }

        if (receivedItems == null || receivedItems.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one received item");
        }

        po.setInvoiceNumber(invoiceNumber.trim());
        if (invoiceDate != null) po.setInvoiceDate(invoiceDate);

        if (amountPaid != null) {
            po.setAmountPaid(po.getAmountPaid().add(amountPaid));
        }

        BigDecimal totalReceivedBatchCost = BigDecimal.ZERO;

        for (Map<String, Object> itemData : receivedItems) {
            Long ingId = Long.parseLong(itemData.get("ingredientId").toString());
            Ingredient ing = ingredientRepository.findById(ingId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid ingredient ID: " + ingId));

            BigDecimal qtyReceived = new BigDecimal(itemData.get("quantity").toString());
            if (qtyReceived.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal unitCost = itemData.containsKey("costPerUnit") && itemData.get("costPerUnit") != null
                    ? new BigDecimal(itemData.get("costPerUnit").toString())
                    : ing.getCostPerUnit();

            String itemUnit = itemData.containsKey("unit") && itemData.get("unit") != null
                    ? itemData.get("unit").toString()
                    : ing.getUnit();

            // Convert to ingredient unit if needed
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

            // 3. Update quantityReceived on matching PurchaseOrderItem if exists
            if (po.getItems() != null) {
                for (PurchaseOrderItem poi : po.getItems()) {
                    if (poi.getIngredient().getId().equals(ing.getId())) {
                        poi.setQuantityReceived(poi.getQuantityReceived().add(convertedQty));
                        purchaseOrderItemRepository.save(poi);
                        break;
                    }
                }
            }

            // 4. Record in Auditable Stock Ledger
            recordMovement(
                    po.getCompany(),
                    po.getBranch(),
                    ing,
                    "PURCHASE_RECEIPT",
                    convertedQty,
                    prevStock,
                    newStock,
                    unitCost,
                    "PURCHASE_ORDER",
                    invoiceNumber,
                    "Received stock against PO #" + po.getPoNumber() + " (Invoice: " + invoiceNumber + ")",
                    username != null ? username : "Inventory Manager"
            );

            totalReceivedBatchCost = totalReceivedBatchCost.add(unitCost.multiply(convertedQty));
        }

        // Determine PO status based on ordered vs received quantities
        boolean allFullyReceived = true;
        boolean anyReceived = false;

        if (po.getItems() != null && !po.getItems().isEmpty()) {
            for (PurchaseOrderItem poi : po.getItems()) {
                if (poi.getQuantityReceived().compareTo(BigDecimal.ZERO) > 0) {
                    anyReceived = true;
                }
                if (poi.getQuantityReceived().compareTo(poi.getQuantityOrdered()) < 0) {
                    allFullyReceived = false;
                }
            }
        } else {
            anyReceived = true;
            allFullyReceived = true;
        }

        if (allFullyReceived) {
            po.setStatus("Received");
        } else if (anyReceived) {
            po.setStatus("Partially Received");
        }

        if (po.getAmountPaid().compareTo(po.getTotalAmount()) >= 0 && po.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            // Already paid
        } else if (po.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            // Partially paid
        }

        purchaseOrderRepository.save(po);

        return Map.of(
                "message", "Stock received and updated successfully",
                "purchaseOrderId", po.getId(),
                "status", po.getStatus(),
                "totalBatchCost", totalReceivedBatchCost
        );
    }
}
