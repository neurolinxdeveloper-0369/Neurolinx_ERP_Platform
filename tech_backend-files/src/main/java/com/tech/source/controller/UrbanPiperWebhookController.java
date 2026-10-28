package com.tech.source.controller;

import com.tech.source.service.UrbanPiperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/aggregators")
public class UrbanPiperWebhookController {

    @Autowired
    private UrbanPiperService urbanPiperService;

    /**
     * Live inbound order webhook from UrbanPiper (Swiggy / Zomato order placed)
     */
    @PostMapping("/order")
    public ResponseEntity<?> handleOrderWebhook(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = urbanPiperService.processOrderWebhook(payload);
        if ("error".equals(result.get("status")) || "failed".equals(result.get("status"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Real-time delivery rider status update (Assigned, Arrived, Out for Delivery)
     */
    @PostMapping("/rider")
    public ResponseEntity<?> handleRiderWebhook(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = urbanPiperService.processRiderWebhook(payload);
        return ResponseEntity.ok(result);
    }

    /**
     * External order status change (Cancelled by customer / aggregator support)
     */
    @PostMapping("/order-status")
    public ResponseEntity<?> handleOrderStatusWebhook(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = urbanPiperService.processOrderStatusWebhook(payload);
        return ResponseEntity.ok(result);
    }
}
