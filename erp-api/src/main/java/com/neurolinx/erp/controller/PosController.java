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
    
    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        System.out.println("GETUSERCOMPANY: email=" + email);
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            System.out.println("GETUSERCOMPANY: User not found in DB");
            return null;
        }
        com.neurolinx.erp.model.User user = userOpt.get();
        System.out.println("GETUSERCOMPANY: found user, role=" + (user.getRole() != null ? user.getRole().getName() : "null"));
        com.neurolinx.erp.model.Company comp = user.getRole() != null ? user.getRole().getCompany() : null;
        System.out.println("GETUSERCOMPANY: company=" + (comp != null ? comp.getName() : "null"));
        return comp;
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
    public ResponseEntity<?> getTables() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(tableRepo.findByCompany(company));
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

        order.setOrderType((String) payload.getOrDefault("orderType", "Dine-In"));
        order.setTotalAmount(new BigDecimal(payload.getOrDefault("totalAmount", "0").toString()));
        order.setPaymentMethod((String) payload.get("paymentMethod"));
        order.setTaxApplied(new BigDecimal(payload.getOrDefault("taxApplied", "0").toString()));
        order.setDiscountApplied(new BigDecimal(payload.getOrDefault("discountApplied", "0").toString()));
        
        if (payload.containsKey("status")) {
            order.setStatus((String) payload.get("status"));
        }
        
        order = orderRepo.save(order);
        
        return ResponseEntity.ok(order);
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
}
