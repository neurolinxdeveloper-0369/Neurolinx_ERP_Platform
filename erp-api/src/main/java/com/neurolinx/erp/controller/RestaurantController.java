package com.neurolinx.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/restaurant")

public class RestaurantController {

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        // Return dummy data structure that matches the frontend ResStats interface
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayRevenue", 0);
        stats.put("todayRevenueDineIn", 0);
        stats.put("todayRevenueTakeaway", 0);
        stats.put("todayOrders", 0);
        stats.put("todayOrdersDineIn", 0);
        stats.put("todayOrdersTakeaway", 0);
        stats.put("activeTables", 0);
        stats.put("avgOrderValue", 0);

        List<Map<String, Object>> weeklyRevenue = new ArrayList<>();
        String[] days = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        for (String day : days) {
            Map<String, Object> daily = new HashMap<>();
            daily.put("day", day);
            daily.put("amount", 0);
            weeklyRevenue.add(daily);
        }
        stats.put("weeklyRevenue", weeklyRevenue);

        stats.put("recentOrders", new ArrayList<>());
        stats.put("pendingKots", 0);

        return ResponseEntity.ok(stats);
    }
}
