package com.neurolinx.erp.service;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Year;
import java.util.*;

@Service
public class UrbanPiperService {

    private static final String URBANPIPER_BASE_URL = "https://api.urbanpiper.com/v1";

    @Autowired private BranchRepository branchRepo;
    @Autowired private CustomerOrderRepository orderRepo;
    @Autowired private DishRepository dishRepo;
    @Autowired private RecipeItemRepository recipeItemRepo;
    @Autowired private IngredientRepository ingredientRepo;
    @Autowired private InventoryService inventoryService;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Process incoming order webhook from UrbanPiper
     */
    public Map<String, Object> processOrderWebhook(Map<String, Object> payload) {
        try {
            Map<String, Object> orderData = payload.containsKey("order") ? (Map<String, Object>) payload.get("order") : payload;
            Map<String, Object> details = orderData.containsKey("details") ? (Map<String, Object>) orderData.get("details") : orderData;
            Map<String, Object> storeData = orderData.containsKey("store") ? (Map<String, Object>) orderData.get("store") : Map.of();
            Map<String, Object> customerData = orderData.containsKey("customer") ? (Map<String, Object>) orderData.get("customer") : Map.of();
            Map<String, Object> deliveryData = orderData.containsKey("delivery") ? (Map<String, Object>) orderData.get("delivery") : Map.of();

            String channel = details.getOrDefault("channel", "Swiggy").toString();
            // Capitalize e.g. "swiggy" -> "Swiggy", "zomato" -> "Zomato"
            channel = channel.substring(0, 1).toUpperCase() + channel.substring(1).toLowerCase();

            String extOrderId = details.getOrDefault("id", details.getOrDefault("order_id", "EXT-" + System.currentTimeMillis())).toString();

            // Locate branch by UrbanPiper Store Ref ID, Swiggy Outlet ID, or Zomato Restaurant ID
            String storeRef = storeData.getOrDefault("merchant_ref_id", "").toString();
            Branch branch = null;
            if (!storeRef.isEmpty()) {
                branch = branchRepo.findByUrbanpiperStoreId(storeRef).orElse(null);
            }
            if (branch == null && details.containsKey("outlet_id")) {
                String outletId = details.get("outlet_id").toString();
                branch = branchRepo.findBySwiggyOutletId(outletId)
                        .or(() -> branchRepo.findByZomatoRestaurantId(outletId))
                        .orElse(null);
            }
            if (branch == null && payload.containsKey("branchId")) {
                branch = branchRepo.findById(Long.parseLong(payload.get("branchId").toString())).orElse(null);
            }
            if (branch == null) {
                branch = branchRepo.findAll().stream().findFirst().orElse(null);
            }

            if (branch == null) {
                return Map.of("status", "failed", "message", "No matching branch outlet found");
            }

            Company company = branch.getCompany();

            CustomerOrder order = new CustomerOrder();
            order.setCompany(company);
            order.setBranch(branch);
            order.setOrderType(channel); // "Swiggy" or "Zomato"
            order.setOrderSource("Online Aggregator");
            
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
                order.setDeliveryStatus(deliveryData.getOrDefault("status", "Order Placed").toString());
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

            // If auto-accept is enabled on this branch, acknowledge the order back to UrbanPiper asynchronously
            if (Boolean.TRUE.equals(branch.getAutoAcceptOrders())) {
                sendOrderStatusUpdateAsync(branch, extOrderId, "Acknowledged", "Auto-accepted by Neurolinx ERP");
            }

            return Map.of(
                    "status", "success",
                    "message", "Order successfully ingested into KDS and Billing",
                    "orderNumber", order.getOrderNumber(),
                    "orderId", order.getId()
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    /**
     * Process real-time Rider status updates from UrbanPiper
     */
    public Map<String, Object> processRiderWebhook(Map<String, Object> payload) {
        try {
            String extOrderId = payload.getOrDefault("order_id", "").toString();
            if (extOrderId.isEmpty()) return Map.of("status", "failed", "message", "order_id missing");

            Optional<CustomerOrder> orderOpt = orderRepo.findAll().stream()
                    .filter(o -> extOrderId.equalsIgnoreCase(o.getExternalOrderId()) || o.getOrderNumber().contains(extOrderId))
                    .findFirst();

            if (orderOpt.isPresent()) {
                CustomerOrder order = orderOpt.get();
                if (payload.containsKey("rider_name")) order.setDeliveryRiderName(payload.get("rider_name").toString());
                if (payload.containsKey("rider_phone")) order.setDeliveryRiderPhone(payload.get("rider_phone").toString());
                if (payload.containsKey("status")) order.setDeliveryStatus(payload.get("status").toString());
                orderRepo.save(order);
                return Map.of("status", "success", "message", "Rider details updated");
            }
            return Map.of("status", "not_found", "message", "Order not found");
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    /**
     * Process order cancellation or external updates from Swiggy / Zomato
     */
    public Map<String, Object> processOrderStatusWebhook(Map<String, Object> payload) {
        try {
            String extOrderId = payload.getOrDefault("order_id", "").toString();
            String status = payload.getOrDefault("status", "").toString();

            Optional<CustomerOrder> orderOpt = orderRepo.findAll().stream()
                    .filter(o -> extOrderId.equalsIgnoreCase(o.getExternalOrderId()) || o.getOrderNumber().contains(extOrderId))
                    .findFirst();

            if (orderOpt.isPresent()) {
                CustomerOrder order = orderOpt.get();
                if ("Cancelled".equalsIgnoreCase(status) || "Customer_Cancelled".equalsIgnoreCase(status)) {
                    order.setStatus("Cancelled");
                    order.setKitchenStatus("Cancelled");
                    order.setDeliveryStatus("Cancelled");
                    orderRepo.save(order);
                    // Restore inventory
                    inventoryService.restoreInventoryForOrder(order, "UrbanPiper Aggregator Webhook");
                }
                return Map.of("status", "success", "message", "Order status updated");
            }
            return Map.of("status", "not_found", "message", "Order not found");
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    /**
     * Outbound status update to UrbanPiper when kitchen changes status
     */
    @Async
    public void sendOrderStatusUpdateAsync(Branch branch, String externalOrderId, String status, String message) {
        try {
            String apiKey = branch != null && branch.getUrbanpiperApiKey() != null && !branch.getUrbanpiperApiKey().isEmpty()
                    ? branch.getUrbanpiperApiKey()
                    : (branch != null && branch.getCompany() != null ? branch.getCompany().getUrbanpiperApiKey() : null);

            String username = branch != null && branch.getUrbanpiperUsername() != null && !branch.getUrbanpiperUsername().isEmpty()
                    ? branch.getUrbanpiperUsername()
                    : (branch != null && branch.getCompany() != null ? branch.getCompany().getUrbanpiperUsername() : null);

            if (apiKey == null || username == null) {
                System.out.println("[UrbanPiperService] No production API key or username configured. Skipping outbound webhook call.");
                return;
            }

            String url = URBANPIPER_BASE_URL + "/orders/" + externalOrderId + "/status/";
            String jsonPayload = String.format("{\"status\":\"%s\",\"message\":\"%s\"}", status, message);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "apikey " + username + ":" + apiKey)
                    .PUT(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            System.out.println("[UrbanPiperService] Status update sent for order " + externalOrderId + ": HTTP " + resp.statusCode());
        } catch (Exception e) {
            System.err.println("[UrbanPiperService] Failed to send status update to UrbanPiper: " + e.getMessage());
        }
    }

    /**
     * Hook called from POS or KDS when kitchen status changes
     */
    public void notifyKitchenStatusChange(CustomerOrder order, String nextKitchenStatus) {
        if (order.getExternalOrderId() == null || order.getExternalOrderId().isEmpty()) return;
        if (!"Swiggy".equalsIgnoreCase(order.getOrderType()) && !"Zomato".equalsIgnoreCase(order.getOrderType())) return;

        String upStatus = null;
        if ("Preparing".equalsIgnoreCase(nextKitchenStatus)) {
            upStatus = "Acknowledged";
        } else if ("Ready".equalsIgnoreCase(nextKitchenStatus)) {
            upStatus = "Food Ready";
        } else if ("Delivered".equalsIgnoreCase(nextKitchenStatus)) {
            upStatus = "Dispatched";
        } else if ("Cancelled".equalsIgnoreCase(nextKitchenStatus)) {
            upStatus = "Cancelled";
        }

        if (upStatus != null) {
            sendOrderStatusUpdateAsync(order.getBranch(), order.getExternalOrderId(), upStatus, "Kitchen updated status to " + nextKitchenStatus);
        }
    }

    /**
     * Outbound item stock toggle (86'ing items on Swiggy and Zomato)
     */
    @Async
    public void toggleItemStockAsync(Branch branch, Long dishId, boolean inStock) {
        try {
            if (branch == null || branch.getUrbanpiperStoreId() == null) return;
            String apiKey = branch.getUrbanpiperApiKey() != null ? branch.getUrbanpiperApiKey() : (branch.getCompany() != null ? branch.getCompany().getUrbanpiperApiKey() : null);
            String username = branch.getUrbanpiperUsername() != null ? branch.getUrbanpiperUsername() : (branch.getCompany() != null ? branch.getCompany().getUrbanpiperUsername() : null);

            if (apiKey == null || username == null) return;

            String url = URBANPIPER_BASE_URL + "/inventory/locations/" + branch.getUrbanpiperStoreId() + "/";
            String jsonPayload = String.format("{\"location_ref_id\":\"%s\",\"items\":[{\"ref_id\":\"%s\",\"available\":%b}]}",
                    branch.getUrbanpiperStoreId(), "DISH-" + dishId, inStock);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "apikey " + username + ":" + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            System.err.println("[UrbanPiperService] Failed to toggle item stock on UrbanPiper: " + e.getMessage());
        }
    }
}
