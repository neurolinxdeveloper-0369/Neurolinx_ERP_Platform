package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;

@RestController
@RequestMapping("/api/aggregators")
public class AggregatorController {

    @Autowired private BranchRepository branchRepo;
    @Autowired private CustomerOrderRepository orderRepo;
    @Autowired private DishRepository dishRepo;
    @Autowired private RecipeItemRepository recipeItemRepo;
    @Autowired private IngredientRepository ingredientRepo;
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

    /**
     * UrbanPiper / Aggregator Webhook Receiver (Public endpoint called by Middleware / Aggregators)
     */
    @PostMapping("/webhook/order")
    public ResponseEntity<?> receiveAggregatorOrder(@RequestBody Map<String, Object> payload) {
        try {
            // Support both UrbanPiper standard format and simple test format
            Map<String, Object> orderData = payload.containsKey("order") ? (Map<String, Object>) payload.get("order") : payload;
            Map<String, Object> details = orderData.containsKey("details") ? (Map<String, Object>) orderData.get("details") : orderData;
            Map<String, Object> storeData = orderData.containsKey("store") ? (Map<String, Object>) orderData.get("store") : Map.of();
            Map<String, Object> customerData = orderData.containsKey("customer") ? (Map<String, Object>) orderData.get("customer") : Map.of();
            Map<String, Object> deliveryData = orderData.containsKey("delivery") ? (Map<String, Object>) orderData.get("delivery") : Map.of();

            String channel = details.getOrDefault("channel", "Swiggy").toString();
            // Capitalize e.g. "swiggy" -> "Swiggy", "zomato" -> "Zomato"
            channel = channel.substring(0, 1).toUpperCase() + channel.substring(1).toLowerCase();

            String extOrderId = details.getOrDefault("id", details.getOrDefault("order_id", "EXT-" + System.currentTimeMillis())).toString();

            // Locate branch
            String storeRef = storeData.getOrDefault("merchant_ref_id", "").toString();
            Branch branch = null;
            if (!storeRef.isEmpty()) {
                branch = branchRepo.findByUrbanpiperStoreId(storeRef).orElse(null);
            }
            if (branch == null && payload.containsKey("branchId")) {
                branch = branchRepo.findById(Long.parseLong(payload.get("branchId").toString())).orElse(null);
            }
            if (branch == null) {
                branch = branchRepo.findAll().stream().findFirst().orElse(null);
            }

            if (branch == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "failed", "message", "No matching branch found"));
            }

            Company company = branch.getCompany();

            CustomerOrder order = new CustomerOrder();
            order.setCompany(company);
            order.setBranch(branch);
            order.setOrderType(channel); // "Swiggy" or "Zomato"
            
            String aggOrderNum = channel.toUpperCase().substring(0, 3) + "-" + extOrderId;
            if (orderRepo.existsByOrderNumber(aggOrderNum)) {
                aggOrderNum += "-" + (System.currentTimeMillis() % 10000);
            }
            order.setOrderNumber(aggOrderNum);
            order.setExternalOrderId(extOrderId);
            order.setStatus("Completed");
            order.setKitchenStatus("Pending");
            order.setPaymentMethod(channel + " (Prepaid)");

            String customerName = customerData.getOrDefault("name", "Online Customer (" + channel + ")").toString();
            String customerPhone = customerData.getOrDefault("phone", "Masked").toString();
            order.setCustomerName(customerName);
            order.setCustomerPhone(customerPhone);

            if (!deliveryData.isEmpty()) {
                order.setDeliveryRiderName(deliveryData.getOrDefault("rider_name", "Assigned Delivery Partner").toString());
                order.setDeliveryRiderPhone(deliveryData.getOrDefault("rider_phone", "Masked").toString());
            }

            BigDecimal total = BigDecimal.ZERO;
            if (details.containsKey("total")) {
                total = new BigDecimal(details.get("total").toString());
            } else if (details.containsKey("total_amount")) {
                total = new BigDecimal(details.get("total_amount").toString());
            }
            order.setTotalAmount(total);

            BigDecimal tax = BigDecimal.ZERO;
            if (details.containsKey("total_taxes")) {
                tax = new BigDecimal(details.get("total_taxes").toString());
            }
            order.setTaxApplied(tax);

            // Process order items
            List<OrderItem> orderItems = new ArrayList<>();
            List<Dish> companyDishes = dishRepo.findByCompany(company);

            List<Map<String, Object>> itemsList = (List<Map<String, Object>>) orderData.getOrDefault("items", new ArrayList<>());
            for (Map<String, Object> itemMap : itemsList) {
                String title = itemMap.getOrDefault("title", itemMap.getOrDefault("name", "Dish")).toString();
                int qty = Integer.parseInt(itemMap.getOrDefault("quantity", 1).toString());
                BigDecimal price = new BigDecimal(itemMap.getOrDefault("price", "100").toString());

                // Find matching dish in restaurant menu
                Dish matchedDish = companyDishes.stream()
                        .filter(d -> d.getName().equalsIgnoreCase(title))
                        .findFirst()
                        .orElse(null);

                if (matchedDish == null && !companyDishes.isEmpty()) {
                    matchedDish = companyDishes.get(0);
                }

                if (matchedDish != null) {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(order);
                    orderItem.setDish(matchedDish);
                    orderItem.setQuantity(qty);
                    orderItem.setPrice(price);
                    orderItems.add(orderItem);
                }
            }
            order.setItems(orderItems);

            order = orderRepo.save(order);

            // Auto-deduct recipe inventory for this online order
            try {
                if (order.getItems() != null) {
                    for (OrderItem oi : order.getItems()) {
                        if (oi.getDish() != null) {
                            List<RecipeItem> recipes = recipeItemRepo.findByDishId(oi.getDish().getId());
                            int qtyOrdered = oi.getQuantity() != null ? oi.getQuantity() : 1;
                            for (RecipeItem r : recipes) {
                                if (r.getIngredient() != null && r.getQuantityRequired() != null) {
                                    BigDecimal totalNeeded = r.getQuantityRequired().multiply(new BigDecimal(qtyOrdered));
                                    Ingredient ing = r.getIngredient();
                                    if (ing.getStockLevel() != null) {
                                        ing.setStockLevel(ing.getStockLevel().subtract(totalNeeded));
                                        ingredientRepo.save(ing);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Order successfully ingested into KDS and Billing",
                    "orderNumber", order.getOrderNumber(),
                    "orderId", order.getId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Instant Order Simulator for testing Swiggy / Zomato order flow
     */
    @PostMapping("/simulate")
    public ResponseEntity<?> simulateOrder(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));

        String channel = payload.getOrDefault("channel", "Swiggy").toString();
        Long branchId = payload.containsKey("branchId") && payload.get("branchId") != null
                ? Long.parseLong(payload.get("branchId").toString())
                : null;

        Branch branch = null;
        if (branchId != null) {
            branch = branchRepo.findByIdAndCompany(branchId, company).orElse(null);
        }
        if (branch == null) {
            List<Branch> bList = branchRepo.findByCompany(company);
            if (!bList.isEmpty()) branch = bList.get(0);
        }

        List<Dish> dishes = dishRepo.findByCompany(company);
        if (dishes.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please create at least 1 Dish in Menu Master first."));
        }

        Dish selectedDish = dishes.get(0);
        BigDecimal price = selectedDish.getPrice() != null ? selectedDish.getPrice() : new BigDecimal("250.00");

        String simulatedExtId = String.valueOf(System.currentTimeMillis()).substring(7);

        Map<String, Object> simPayload = new HashMap<>();
        simPayload.put("branchId", branch != null ? branch.getId() : null);

        Map<String, Object> details = new HashMap<>();
        details.put("channel", channel);
        details.put("id", simulatedExtId);
        details.put("total", price.add(new BigDecimal("25.00")));
        details.put("total_taxes", new BigDecimal("25.00"));
        simPayload.put("details", details);

        Map<String, Object> customer = new HashMap<>();
        customer.put("name", "Sandeep (Test " + channel + " Diner)");
        customer.put("phone", "+91 80 4712 9988");
        simPayload.put("customer", customer);

        Map<String, Object> delivery = new HashMap<>();
        delivery.put("rider_name", channel + " Rider (Rahul)");
        delivery.put("rider_phone", "+91 98765 43210");
        simPayload.put("delivery", delivery);

        Map<String, Object> item = new HashMap<>();
        item.put("title", selectedDish.getName());
        item.put("quantity", 2);
        item.put("price", price);
        simPayload.put("items", List.of(item));

        return receiveAggregatorOrder(simPayload);
    }
}
