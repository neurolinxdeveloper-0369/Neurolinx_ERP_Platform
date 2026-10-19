package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.time.Year;

@RestController
@RequestMapping("/api/pos")
public class PosController {

    @Autowired private DishCategoryRepository categoryRepo;
    @Autowired private DishRepository dishRepo;
    @Autowired private RestaurantTableRepository tableRepo;
    @Autowired private CustomerOrderRepository orderRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;
    @Autowired private RecipeItemRepository recipeItemRepo;
    @Autowired private IngredientRepository ingredientRepo;
    @Autowired private EmployeeRepository employeeRepo;
    @Autowired private com.neurolinx.erp.service.InventoryService inventoryService;
    

    @Autowired private BranchRepository branchRepo;
    @Autowired private jakarta.servlet.http.HttpServletRequest request;

    private Long getBranchId() {
        String header = request.getHeader("X-Branch-Id");
        if (header != null && !header.isEmpty() && !header.equals("global")) {
            try { return Long.parseLong(header); } catch (Exception e) {}
        }
        return null;
    }

    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCompany() != null) {
                return user.getCompany();
            }
            if (user.getRole() != null && user.getRole().getCompany() != null) {
                return user.getRole().getCompany();
            }
        }
        return companyRepo.findAll().stream().findFirst().orElse(null);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(categoryRepo.findByCompany(company));
    }

    @GetMapping("/dishes")
    public ResponseEntity<?> getDishes() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(dishRepo.findByCompany(company));
    }

    @GetMapping("/tables")
    public ResponseEntity<?> getTables(@RequestParam(required = false) Integer floor) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        if (floor != null) {
            return ResponseEntity.ok(tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(company, floor));
        }
        return ResponseEntity.ok(tableRepo.findByCompanyOrderByFloorAscPositionAscIdAsc(company));
    }

    @PostMapping("/tables/configure")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> configureTables(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        
        if (!payload.containsKey("floor") || !payload.containsKey("tables")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "floor and tables are required"));
        }
        
        Integer floor = Integer.parseInt(payload.get("floor").toString());
        List<Map<String, Object>> tablesData = (List<Map<String, Object>>) payload.get("tables");
        if (tablesData == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "tables cannot be null"));
        }
        
        List<RestaurantTable> existing = tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(company, floor);
        List<RestaurantTable> result = new java.util.ArrayList<>();
        
        for (int i = 0; i < tablesData.size(); i++) {
            Map<String, Object> tData = tablesData.get(i);
            int capacity = Integer.parseInt(tData.getOrDefault("capacity", 4).toString());
            RestaurantTable table;
            if (i < existing.size()) {
                table = existing.get(i);
            } else {
                table = new RestaurantTable();
                table.setCompany(company);
                table.setFloor(floor);
                table.setStatus("Free");
            }
            table.setTableName(tData.containsKey("tableName") ? tData.get("tableName").toString() : "Table " + (i + 1));
            table.setCapacity(capacity);
            table.setPosition(i + 1);
            if (table.getStatus() == null) {
                table.setStatus("Free");
            }
            result.add(tableRepo.save(table));
        }
        
        if (existing.size() > tablesData.size()) {
            for (int i = tablesData.size(); i < existing.size(); i++) {
                RestaurantTable surplus = existing.get(i);
                try {
                    if (orderRepo.existsByRestaurantTable(surplus)) {
                        surplus.setPosition(null);
                        tableRepo.save(surplus);
                    } else {
                        tableRepo.delete(surplus);
                    }
                } catch (Exception e) {
                    // Safe cleanup fallback
                }
            }
        }
        
        return ResponseEntity.ok(result);
    }

    @PutMapping("/tables/{id}/status")
    public ResponseEntity<?> updateTableStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        
        return tableRepo.findById(id).map(table -> {
            if (!table.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(java.util.Map.of("message", "Unauthorized"));
            }
            if (payload.containsKey("status") && payload.get("status") != null) {
                table.setStatus(payload.get("status").toString());
                return ResponseEntity.ok(tableRepo.save(table));
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "status is required"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/tables/{id}")
    public ResponseEntity<?> updateTable(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        
        return tableRepo.findById(id).map(table -> {
            if (!table.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(java.util.Map.of("message", "Unauthorized"));
            }
            if (payload.containsKey("capacity") && payload.get("capacity") != null) {
                table.setCapacity(Integer.parseInt(payload.get("capacity").toString()));
            }
            if (payload.containsKey("tableName") && payload.get("tableName") != null) {
                table.setTableName(payload.get("tableName").toString());
            }
            return ResponseEntity.ok(tableRepo.save(table));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        
        CustomerOrder order = new CustomerOrder();
        order.setCompany(company);
        
        String yearPrefix = String.valueOf(Year.now().getValue()).substring(2);
        String nextSequence = "0001";
        try {
            CustomerOrder lastOrder = orderRepo.findTopByCompanyOrderByIdDesc(company);
            if (lastOrder != null && lastOrder.getOrderNumber() != null && lastOrder.getOrderNumber().startsWith(yearPrefix)) {
                String lastSeqStr = lastOrder.getOrderNumber().substring(2);
                int lastSeq = Integer.parseInt(lastSeqStr);
                nextSequence = String.format("%04d", lastSeq + 1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        order.setOrderNumber(yearPrefix + nextSequence);

        String orderType = (String) payload.getOrDefault("orderType", "Dine-In");
        order.setOrderType(orderType);
        order.setTotalAmount(new BigDecimal(payload.getOrDefault("totalAmount", "0").toString()));
        order.setPaymentMethod((String) payload.get("paymentMethod"));
        order.setTaxApplied(new BigDecimal(payload.getOrDefault("taxApplied", "0").toString()));
        order.setDiscountApplied(new BigDecimal(payload.getOrDefault("discountApplied", "0").toString()));
        
        if (payload.containsKey("status")) {
            order.setStatus((String) payload.get("status"));
        }
        if (payload.containsKey("kitchenStatus") && payload.get("kitchenStatus") != null) {
            order.setKitchenStatus(payload.get("kitchenStatus").toString());
        } else {
            order.setKitchenStatus("Pending");
        }
        if (payload.containsKey("notes") && payload.get("notes") != null) {
            order.setNotes(payload.get("notes").toString());
        }

        Long branchId = getBranchId();
        if (branchId == null && payload.get("branchId") != null) {
            try { branchId = Long.parseLong(payload.get("branchId").toString()); } catch (Exception e) {}
        }
        if (branchId != null) {
            branchRepo.findById(branchId).ifPresent(order::setBranch);
        }

        if ("Dine-In".equalsIgnoreCase(orderType) && payload.get("tableId") != null && !payload.get("tableId").toString().isEmpty()) {
            try {
                Long tableId = Long.parseLong(payload.get("tableId").toString());
                RestaurantTable table = tableRepo.findById(tableId).orElse(null);
                if (table != null && table.getCompany().getId().equals(company.getId())) {
                    order.setRestaurantTable(table);
                    table.setStatus("Occupied");
                    tableRepo.save(table);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if ("Delivery".equalsIgnoreCase(orderType)) {
            String custName = payload.get("customerName") != null ? payload.get("customerName").toString().trim() : "";
            if (custName.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Customer name is required for delivery orders."));
            }
            order.setCustomerName(custName);

            String custPhone = payload.get("customerPhone") != null ? payload.get("customerPhone").toString().trim() : "";
            if (custPhone.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Customer contact number is required for delivery orders."));
            }
            order.setCustomerPhone(custPhone);

            String delivAddr = payload.get("deliveryAddress") != null ? payload.get("deliveryAddress").toString().trim() : "";
            if (delivAddr.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Delivery address is required for delivery orders."));
            }
            order.setDeliveryAddress(delivAddr);

            if (payload.containsKey("deliveryArea") && payload.get("deliveryArea") != null) {
                order.setDeliveryArea(payload.get("deliveryArea").toString().trim());
            }
            if (payload.containsKey("deliveryCity") && payload.get("deliveryCity") != null) {
                order.setDeliveryCity(payload.get("deliveryCity").toString().trim());
            }
            if (payload.containsKey("deliveryPostalCode") && payload.get("deliveryPostalCode") != null) {
                order.setDeliveryPostalCode(payload.get("deliveryPostalCode").toString().trim());
            }
            if (payload.containsKey("deliveryInstructions") && payload.get("deliveryInstructions") != null) {
                order.setDeliveryInstructions(payload.get("deliveryInstructions").toString().trim());
            }

            String delivStatus = payload.getOrDefault("deliveryStatus", "Order Placed").toString().trim();
            order.setDeliveryStatus(delivStatus);

            int prepMins = 20;
            if (payload.containsKey("estimatedPrepMinutes") && payload.get("estimatedPrepMinutes") != null) {
                try { prepMins = Integer.parseInt(payload.get("estimatedPrepMinutes").toString()); } catch (Exception ignored) {}
            }
            order.setEstimatedPrepMinutes(prepMins);
            java.time.LocalDateTime readyTime = java.time.LocalDateTime.now().plusMinutes(prepMins);
            order.setExpectedReadyTime(readyTime);

            int delivMins = 30;
            if (payload.containsKey("estimatedDeliveryMinutes") && payload.get("estimatedDeliveryMinutes") != null) {
                try { delivMins = Integer.parseInt(payload.get("estimatedDeliveryMinutes").toString()); } catch (Exception ignored) {}
            }
            order.setEstimatedDeliveryMinutes(delivMins);
            order.setExpectedDeliveryTime(readyTime.plusMinutes(delivMins));

            if (payload.containsKey("deliveryStaffId") && payload.get("deliveryStaffId") != null && !payload.get("deliveryStaffId").toString().isEmpty()) {
                try {
                    Long staffId = Long.parseLong(payload.get("deliveryStaffId").toString());
                    var empOpt = employeeRepo.findByIdAndCompany(staffId, company);
                    if (empOpt.isPresent()) {
                        Employee emp = empOpt.get();
                        order.setDeliveryStaffId(emp.getId());
                        order.setDeliveryStaffName(emp.getName());
                        order.setDeliveryStaffPhone(emp.getPhone());
                        order.setDeliveryAssignedBy(SecurityContextHolder.getContext().getAuthentication().getName());
                        order.setDeliveryAssignedAt(java.time.LocalDateTime.now());
                    }
                } catch (Exception ignored) {}
            }
        }

        if (payload.containsKey("items") && payload.get("items") instanceof List) {
            List<Map<String, Object>> itemsList = (List<Map<String, Object>>) payload.get("items");
            List<OrderItem> orderItems = new java.util.ArrayList<>();
            for (Map<String, Object> itemData : itemsList) {
                if (itemData.get("dishId") != null) {
                    try {
                        Long dishId = Long.parseLong(itemData.get("dishId").toString());
                        Dish dish = dishRepo.findById(dishId).orElse(null);
                        if (dish != null) {
                            OrderItem item = new OrderItem();
                            item.setOrder(order);
                            item.setDish(dish);
                            item.setDishName(dish.getName());
                            int qty = itemData.containsKey("quantity") ? Integer.parseInt(itemData.get("quantity").toString()) : 1;
                            item.setQuantity(qty);
                            item.setPrice(dish.getPrice() != null ? dish.getPrice() : BigDecimal.ZERO);
                            if (itemData.containsKey("notes") && itemData.get("notes") != null) {
                                item.setNotes(itemData.get("notes").toString());
                            }
                            orderItems.add(item);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
            order.setItems(orderItems);
        }
        
        order = orderRepo.save(order);

        // Auto-deduct inventory using unit-aware and idempotent InventoryService
        try {
            inventoryService.deductInventoryForOrder(order, SecurityContextHolder.getContext().getAuthentication().getName());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/all")
    public ResponseEntity<?> getAllOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(orderRepo.findByCompanyAndBranchId(company, branchId));
        }
        return ResponseEntity.ok(orderRepo.findByCompany(company));
    }

    @PutMapping("/orders/{id}/kitchen-status")
    public ResponseEntity<?> updateKitchenStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("kitchenStatus") && payload.get("kitchenStatus") != null) {
                String kStatus = payload.get("kitchenStatus").toString();
                order.setKitchenStatus(kStatus);
                if ("Completed".equalsIgnoreCase(kStatus) && "Pending".equalsIgnoreCase(order.getStatus())) {
                    order.setStatus("Completed");
                }
                if ("Delivery".equalsIgnoreCase(order.getOrderType())) {
                    if ("Preparing".equalsIgnoreCase(kStatus) && ("Order Placed".equalsIgnoreCase(order.getDeliveryStatus()) || order.getDeliveryStatus() == null)) {
                        order.setDeliveryStatus("Preparing");
                    } else if ("Ready".equalsIgnoreCase(kStatus) && !"Out for Delivery".equalsIgnoreCase(order.getDeliveryStatus()) && !"Delivered".equalsIgnoreCase(order.getDeliveryStatus())) {
                        order.setDeliveryStatus("Ready for Dispatch");
                    }
                }
            }
            if (payload.containsKey("status") && payload.get("status") != null) {
                String newStatus = payload.get("status").toString();
                order.setStatus(newStatus);
                if ("Cancelled".equalsIgnoreCase(newStatus)) {
                    inventoryService.restoreInventoryForOrder(order, SecurityContextHolder.getContext().getAuthentication().getName());
                }
            }
            if (payload.containsKey("notes") && payload.get("notes") != null) {
                order.setNotes(payload.get("notes").toString());
            }
            CustomerOrder saved = orderRepo.save(order);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("status") && payload.get("status") != null) {
                String newStatus = payload.get("status").toString();
                order.setStatus(newStatus);
                if ("Cancelled".equalsIgnoreCase(newStatus)) {
                    inventoryService.restoreInventoryForOrder(order, SecurityContextHolder.getContext().getAuthentication().getName());
                }
            }
            return ResponseEntity.ok(orderRepo.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/deliveries")
    public ResponseEntity<?> getDeliveryOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(orderRepo.findByCompanyAndBranchIdAndOrderTypeOrderByIdDesc(company, branchId, "Delivery"));
        }
        return ResponseEntity.ok(orderRepo.findByCompanyAndOrderTypeOrderByIdDesc(company, "Delivery"));
    }

    @PutMapping("/orders/{id}/delivery-assign")
    public ResponseEntity<?> assignDeliveryPerson(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));

        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(java.util.Map.of("message", "Unauthorized"));
            }
            if (!"Delivery".equalsIgnoreCase(order.getOrderType())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Order is not a Delivery order"));
            }
            if ("Cancelled".equalsIgnoreCase(order.getDeliveryStatus()) || "Delivered".equalsIgnoreCase(order.getDeliveryStatus())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Cannot reassign staff for " + order.getDeliveryStatus() + " orders."));
            }

            if (!payload.containsKey("staffId") || payload.get("staffId") == null || payload.get("staffId").toString().isEmpty()) {
                order.setDeliveryStaffId(null);
                order.setDeliveryStaffName(null);
                order.setDeliveryStaffPhone(null);
                order.setDeliveryAssignedBy(null);
                order.setDeliveryAssignedAt(null);
            } else {
                try {
                    Long staffId = Long.parseLong(payload.get("staffId").toString());
                    var empOpt = employeeRepo.findByIdAndCompany(staffId, company);
                    if (empOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body(java.util.Map.of("message", "Staff member not found or does not belong to company"));
                    }
                    Employee emp = empOpt.get();
                    order.setDeliveryStaffId(emp.getId());
                    order.setDeliveryStaffName(emp.getName());
                    order.setDeliveryStaffPhone(emp.getPhone());
                    order.setDeliveryAssignedBy(SecurityContextHolder.getContext().getAuthentication().getName());
                    order.setDeliveryAssignedAt(java.time.LocalDateTime.now());
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid staff ID"));
                }
            }
            return ResponseEntity.ok(orderRepo.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/orders/{id}/delivery-status")
    public ResponseEntity<?> updateDeliveryStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));

        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(java.util.Map.of("message", "Unauthorized"));
            }
            if (!"Delivery".equalsIgnoreCase(order.getOrderType())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Order is not a Delivery order"));
            }
            if (!payload.containsKey("deliveryStatus") || payload.get("deliveryStatus") == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "deliveryStatus is required"));
            }

            String newStatus = payload.get("deliveryStatus").toString().trim();
            String currentStatus = order.getDeliveryStatus() != null ? order.getDeliveryStatus() : "Order Placed";

            if ("Delivered".equalsIgnoreCase(currentStatus) && !"Delivered".equalsIgnoreCase(newStatus)) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Cannot modify status of an already delivered order."));
            }
            if ("Cancelled".equalsIgnoreCase(currentStatus) && !"Cancelled".equalsIgnoreCase(newStatus)) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Cannot modify status of a cancelled order."));
            }

            switch (newStatus) {
                case "Order Placed":
                    order.setDeliveryStatus("Order Placed");
                    order.setKitchenStatus("Pending");
                    break;
                case "Preparing":
                    order.setDeliveryStatus("Preparing");
                    order.setKitchenStatus("Preparing");
                    break;
                case "Ready for Dispatch":
                    order.setDeliveryStatus("Ready for Dispatch");
                    order.setKitchenStatus("Ready");
                    break;
                case "Out for Delivery":
                    if (payload.containsKey("staffId") && payload.get("staffId") != null && !payload.get("staffId").toString().isEmpty()) {
                        try {
                            Long staffId = Long.parseLong(payload.get("staffId").toString());
                            employeeRepo.findByIdAndCompany(staffId, company).ifPresent(emp -> {
                                order.setDeliveryStaffId(emp.getId());
                                order.setDeliveryStaffName(emp.getName());
                                order.setDeliveryStaffPhone(emp.getPhone());
                                order.setDeliveryAssignedBy(SecurityContextHolder.getContext().getAuthentication().getName());
                                order.setDeliveryAssignedAt(java.time.LocalDateTime.now());
                            });
                        } catch (Exception ignored) {}
                    }
                    order.setDeliveryStatus("Out for Delivery");
                    order.setKitchenStatus("Completed");
                    if (order.getDispatchedAt() == null) {
                        order.setDispatchedAt(java.time.LocalDateTime.now());
                    }
                    break;
                case "Delivered":
                    order.setDeliveryStatus("Delivered");
                    order.setKitchenStatus("Completed");
                    order.setStatus("Completed");
                    if (order.getDeliveredAt() == null) {
                        order.setDeliveredAt(java.time.LocalDateTime.now());
                    }
                    break;
                case "Cancelled":
                    order.setDeliveryStatus("Cancelled");
                    order.setStatus("Cancelled");
                    inventoryService.restoreInventoryForOrder(order, SecurityContextHolder.getContext().getAuthentication().getName());
                    break;
                default:
                    return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid delivery status: " + newStatus));
            }

            return ResponseEntity.ok(orderRepo.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/orders/{id}/delivery-estimates")
    public ResponseEntity<?> updateDeliveryEstimates(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));

        return orderRepo.findById(id).map(order -> {
            if (!order.getCompany().getId().equals(company.getId())) {
                return ResponseEntity.status(403).body(java.util.Map.of("message", "Unauthorized"));
            }
            if (!"Delivery".equalsIgnoreCase(order.getOrderType())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Order is not a Delivery order"));
            }

            if (payload.containsKey("estimatedPrepMinutes") && payload.get("estimatedPrepMinutes") != null) {
                try {
                    int prepMins = Integer.parseInt(payload.get("estimatedPrepMinutes").toString());
                    order.setEstimatedPrepMinutes(prepMins);
                    java.time.LocalDateTime base = order.getCreatedAt() != null ? order.getCreatedAt() : java.time.LocalDateTime.now();
                    order.setExpectedReadyTime(base.plusMinutes(prepMins));
                } catch (Exception ignored) {}
            }
            if (payload.containsKey("estimatedDeliveryMinutes") && payload.get("estimatedDeliveryMinutes") != null) {
                try {
                    int delivMins = Integer.parseInt(payload.get("estimatedDeliveryMinutes").toString());
                    order.setEstimatedDeliveryMinutes(delivMins);
                    java.time.LocalDateTime readyBase = order.getExpectedReadyTime() != null ? order.getExpectedReadyTime() : java.time.LocalDateTime.now();
                    order.setExpectedDeliveryTime(readyBase.plusMinutes(delivMins));
                } catch (Exception ignored) {}
            }
            if (payload.containsKey("expectedReadyTime") && payload.get("expectedReadyTime") != null) {
                try {
                    order.setExpectedReadyTime(java.time.LocalDateTime.parse(payload.get("expectedReadyTime").toString()));
                } catch (Exception ignored) {}
            }
            if (payload.containsKey("expectedDeliveryTime") && payload.get("expectedDeliveryTime") != null) {
                try {
                    order.setExpectedDeliveryTime(java.time.LocalDateTime.parse(payload.get("expectedDeliveryTime").toString()));
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(orderRepo.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/recent")
    public ResponseEntity<?> getRecentOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(orderRepo.findTop10ByCompanyAndBranchIdOrderByIdDesc(company, branchId));
        }
        return ResponseEntity.ok(orderRepo.findTop10ByCompanyOrderByIdDesc(company));
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        DishCategory cat = new DishCategory();
        cat.setName((String) payload.get("name"));
        cat.setCompany(company);
        return ResponseEntity.ok(categoryRepo.save(cat));
    }

    @PostMapping("/dishes")
    public ResponseEntity<?> createDish(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        Dish dish = new Dish();
        dish.setName((String) payload.get("name"));
        dish.setPrice(new BigDecimal(payload.get("price").toString()));
        if (payload.containsKey("categoryId") && payload.get("categoryId") != null) {
            try {
                Long catId = Long.parseLong(payload.get("categoryId").toString());
                dish.setCategory(categoryRepo.findById(catId).orElse(null));
            } catch (Exception e) {}
        }
        dish.setCompany(company);
        
        if (payload.containsKey("imageBase64")) dish.setImageBase64((String) payload.get("imageBase64"));
        if (payload.containsKey("isTodaysSpecial")) dish.setIsTodaysSpecial((Boolean) payload.get("isTodaysSpecial"));
        if (payload.containsKey("discountPercentage")) dish.setDiscountPercentage(new BigDecimal(payload.get("discountPercentage").toString()));
        
        return ResponseEntity.ok(dishRepo.save(dish));
    }

    @PutMapping("/dishes/{id}/availability")
    public ResponseEntity<?> toggleDishAvailability(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return dishRepo.findById(id).map(dish -> {
            dish.setIsAvailable((Boolean) payload.get("isAvailable"));
            return ResponseEntity.ok(dishRepo.save(dish));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return categoryRepo.findById(id).map(cat -> {
            if (!cat.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("name")) cat.setName((String) payload.get("name"));
            return ResponseEntity.ok(categoryRepo.save(cat));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        Company company = getUserCompany();
        return categoryRepo.findById(id).map(cat -> {
            if (!cat.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            categoryRepo.delete(cat);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/dishes/{id}")
    public ResponseEntity<?> updateDish(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return dishRepo.findById(id).map(dish -> {
            if (!dish.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("name")) dish.setName((String) payload.get("name"));
            if (payload.containsKey("price")) dish.setPrice(new BigDecimal(payload.get("price").toString()));
            if (payload.containsKey("categoryId") && payload.get("categoryId") != null) {
                try {
                    Long catId = Long.parseLong(payload.get("categoryId").toString());
                    dish.setCategory(categoryRepo.findById(catId).orElse(null));
                } catch (Exception e) {}
            }
            if (payload.containsKey("imageBase64")) dish.setImageBase64((String) payload.get("imageBase64"));
            if (payload.containsKey("isTodaysSpecial")) dish.setIsTodaysSpecial((Boolean) payload.get("isTodaysSpecial"));
            if (payload.containsKey("discountPercentage")) dish.setDiscountPercentage(new BigDecimal(payload.get("discountPercentage").toString()));
            return ResponseEntity.ok(dishRepo.save(dish));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/dishes/{id}")
    public ResponseEntity<?> deleteDish(@PathVariable Long id) {
        Company company = getUserCompany();
        return dishRepo.findById(id).map(dish -> {
            if (!dish.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            dishRepo.delete(dish);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
