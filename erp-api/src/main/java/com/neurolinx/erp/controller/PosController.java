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
        var userOpt = userRepo.findByEmail(email);
        return userOpt.map(user -> user.getRole() != null ? user.getRole().getCompany() : null).orElse(null);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body("Company not found");
        return ResponseEntity.ok(categoryRepo.findByCompany(company));
    }

    @GetMapping("/dishes")
    public ResponseEntity<?> getDishes() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body("Company not found");
        return ResponseEntity.ok(dishRepo.findByCompany(company));
    }

    @GetMapping("/tables")
    public ResponseEntity<?> getTables() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body("Company not found");
        return ResponseEntity.ok(tableRepo.findByCompany(company));
    }
    
    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body("Company not found");
        
        CustomerOrder order = new CustomerOrder();
        order.setCompany(company);
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setOrderType((String) payload.getOrDefault("orderType", "Dine-In"));
        order.setTotalAmount(new BigDecimal(payload.getOrDefault("totalAmount", "0").toString()));
        order = orderRepo.save(order);
        
        return ResponseEntity.ok(order);
    }
}
