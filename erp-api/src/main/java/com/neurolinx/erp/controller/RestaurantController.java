package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurant")
public class RestaurantController {

    @Autowired private CustomerOrderRepository orderRepo;
    @Autowired private RestaurantTableRepository tableRepo;
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

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        Company company = getUserCompany();
        if (company == null) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("todayRevenue", 0);
            fallback.put("todayRevenueDineIn", 0);
            fallback.put("todayRevenueTakeaway", 0);
            fallback.put("todayOrders", 0);
            fallback.put("todayOrdersDineIn", 0);
            fallback.put("todayOrdersTakeaway", 0);
            fallback.put("activeTables", 0);
            fallback.put("totalTables", 0);
            fallback.put("avgOrderValue", 0);

            List<Map<String, Object>> weeklyRevenue = new ArrayList<>();
            String[] days = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
            for (String day : days) {
                Map<String, Object> daily = new HashMap<>();
                daily.put("day", day);
                daily.put("amount", 0);
                daily.put("orderCount", 0);
                weeklyRevenue.add(daily);
            }
            fallback.put("weeklyRevenue", weeklyRevenue);
            fallback.put("recentOrders", new ArrayList<>());
            fallback.put("pendingKots", 0);
            return ResponseEntity.ok(fallback);
        }

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay();

        List<CustomerOrder> todayOrdersList = orderRepo.findByCompanyAndCreatedAtBetween(company, todayStart, todayEnd);

        BigDecimal todayRevenue = BigDecimal.ZERO;
        BigDecimal todayRevenueDineIn = BigDecimal.ZERO;
        BigDecimal todayRevenueTakeaway = BigDecimal.ZERO;
        int todayOrdersCount = todayOrdersList.size();
        int todayOrdersDineIn = 0;
        int todayOrdersTakeaway = 0;

        for (CustomerOrder o : todayOrdersList) {
            BigDecimal amt = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            boolean isCompleted = !"Cancelled".equalsIgnoreCase(o.getStatus()) && !"Voided".equalsIgnoreCase(o.getStatus());
            if (isCompleted) {
                todayRevenue = todayRevenue.add(amt);
            }
            if ("Takeaway".equalsIgnoreCase(o.getOrderType())) {
                todayOrdersTakeaway++;
                if (isCompleted) {
                    todayRevenueTakeaway = todayRevenueTakeaway.add(amt);
                }
            } else {
                todayOrdersDineIn++;
                if (isCompleted) {
                    todayRevenueDineIn = todayRevenueDineIn.add(amt);
                }
            }
        }

        long activeTablesCount = tableRepo.countByCompanyAndStatus(company, "Occupied");
        long totalTablesCount = tableRepo.countByCompany(company);

        BigDecimal avgOrderValue = BigDecimal.ZERO;
        if (todayOrdersCount > 0) {
            avgOrderValue = todayRevenue.divide(BigDecimal.valueOf(todayOrdersCount), 2, RoundingMode.HALF_UP);
        }

        // Weekly revenue from Monday to Sunday of the current week
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Map<String, Object>> weeklyRevenue = new ArrayList<>();
        String[] dayNames = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };

        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            LocalDateTime dStart = d.atStartOfDay();
            LocalDateTime dEnd = d.plusDays(1).atStartOfDay();
            List<CustomerOrder> dayOrders = orderRepo.findByCompanyAndCreatedAtBetween(company, dStart, dEnd);
            
            BigDecimal daySum = BigDecimal.ZERO;
            int dayCount = 0;
            for (CustomerOrder o : dayOrders) {
                if (!"Cancelled".equalsIgnoreCase(o.getStatus()) && !"Voided".equalsIgnoreCase(o.getStatus())) {
                    daySum = daySum.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    dayCount++;
                }
            }

            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("day", dayNames[i]);
            dayMap.put("date", d.toString());
            dayMap.put("amount", daySum);
            dayMap.put("orderCount", dayCount);
            weeklyRevenue.add(dayMap);
        }

        // Kitchen Queue - count pending kitchen orders / KOTs
        long pendingKots = orderRepo.countByCompanyAndStatusIn(company, List.of("Pending", "Preparing", "Kitchen", "Parked"));

        // Recent Orders (Top 10)
        List<CustomerOrder> recentOrderEntities = orderRepo.findTop10ByCompanyOrderByIdDesc(company);
        List<Map<String, Object>> recentOrders = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        for (CustomerOrder o : recentOrderEntities) {
            Map<String, Object> ord = new HashMap<>();
            ord.put("id", o.getOrderNumber() != null ? o.getOrderNumber() : "ORD-" + o.getId());
            ord.put("orderNumber", o.getOrderNumber() != null ? o.getOrderNumber() : "ORD-" + o.getId());
            String tableOrType = "Takeaway";
            if ("Dine-In".equalsIgnoreCase(o.getOrderType())) {
                tableOrType = (o.getRestaurantTable() != null && o.getRestaurantTable().getTableName() != null)
                        ? o.getRestaurantTable().getTableName()
                        : "Dine-In";
            }
            ord.put("table", tableOrType);
            ord.put("orderType", o.getOrderType() != null ? o.getOrderType() : "Dine-In");
            ord.put("time", o.getCreatedAt() != null ? o.getCreatedAt().format(timeFormatter) : "");
            ord.put("amount", o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
            ord.put("status", o.getStatus() != null ? o.getStatus() : "Completed");
            ord.put("paymentMethod", o.getPaymentMethod() != null ? o.getPaymentMethod() : "UPI");
            recentOrders.add(ord);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("todayRevenue", todayRevenue);
        stats.put("todayRevenueDineIn", todayRevenueDineIn);
        stats.put("todayRevenueTakeaway", todayRevenueTakeaway);
        stats.put("todayOrders", todayOrdersCount);
        stats.put("todayOrdersDineIn", todayOrdersDineIn);
        stats.put("todayOrdersTakeaway", todayOrdersTakeaway);
        stats.put("activeTables", activeTablesCount);
        stats.put("totalTables", totalTablesCount);
        stats.put("avgOrderValue", avgOrderValue);
        stats.put("weeklyRevenue", weeklyRevenue);
        stats.put("recentOrders", recentOrders);
        stats.put("pendingKots", pendingKots);

        // Calculate Top Selling Items (all time for now, or just from all orders)
        Map<String, Integer> itemSales = new HashMap<>();
        List<CustomerOrder> allOrders = orderRepo.findByCompany(company);
        for (CustomerOrder o : allOrders) {
            if ("Completed".equals(o.getStatus())) {
                for (OrderItem item : o.getItems()) {
                    String dName = item.getDishName() != null ? item.getDishName() : (item.getDish() != null ? item.getDish().getName() : "Unknown");
                    itemSales.put(dName, itemSales.getOrDefault(dName, 0) + item.getQuantity());
                }
            }
        }
        List<Map<String, Object>> topSellingItems = itemSales.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", e.getKey());
                m.put("sales", e.getValue());
                return m;
            })
            .collect(Collectors.toList());

        stats.put("topSellingItems", topSellingItems);


        return ResponseEntity.ok(stats);
    }
}
