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
            table.setTableName("Table " + (i + 1));
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
                            int qty = itemData.containsKey("quantity") ? Integer.parseInt(itemData.get("quantity").toString()) : 1;
                            item.setQuantity(qty);
                            item.setPrice(dish.getPrice() != null ? dish.getPrice() : BigDecimal.ZERO);
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
        
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/recent")
    public ResponseEntity<?> getRecentOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
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
        Long catId = Long.parseLong(payload.get("categoryId").toString());
        dish.setCategory(categoryRepo.findById(catId).orElse(null));
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
            if (payload.containsKey("categoryId")) {
                Long catId = Long.parseLong(payload.get("categoryId").toString());
                dish.setCategory(categoryRepo.findById(catId).orElse(null));
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
