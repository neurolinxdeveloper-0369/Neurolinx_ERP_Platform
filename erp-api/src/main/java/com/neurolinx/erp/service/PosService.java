package com.neurolinx.erp.service;

import com.neurolinx.erp.dto.CreateOrderRequest;
import com.neurolinx.erp.dto.CreateOrderItemRequest;
import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class PosService {

    private final CustomerOrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final DishRepository dishRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeItemRepository recipeItemRepository;

    public PosService(CustomerOrderRepository orderRepository,
                      RestaurantTableRepository tableRepository,
                      DishRepository dishRepository,
                      PaymentTransactionRepository paymentRepository,
                      IngredientRepository ingredientRepository,
                      RecipeItemRepository recipeItemRepository) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.dishRepository = dishRepository;
        this.paymentRepository = paymentRepository;
        this.ingredientRepository = ingredientRepository;
        this.recipeItemRepository = recipeItemRepository;
    }

    @Transactional
    public CustomerOrder createOrder(CreateOrderRequest request) {
        CustomerOrder order = new CustomerOrder();
        order.setOrderNumber(generateOrderNumber());
        order.setOrderType(request.getOrderType());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setTotalAmount(request.getTotalAmount());
        order.setTaxApplied(request.getTaxApplied());
        order.setDiscountApplied(request.getDiscountApplied());
        order.setStatus(request.getStatus() != null ? request.getStatus() : "Pending");
        order.setCreatedAt(LocalDateTime.now());

        if (request.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(request.getTableId()).orElseThrow();
            order.setRestaurantTable(table);
            table.setStatus("Occupied");
            tableRepository.save(table);
        }

        List<OrderItem> orderItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (CreateOrderItemRequest itemReq : request.getItems()) {
                OrderItem item = new OrderItem();
                item.setDishName(itemReq.getDishName());
                item.setQuantity(itemReq.getQuantity());
                item.setPrice(itemReq.getPrice());
                item.setNotes(itemReq.getNotes());
                item.setOrder(order);
                orderItems.add(item);
                
                // Deduct inventory if dishId is provided
                if (itemReq.getDishId() != null) {
                    deductInventory(itemReq.getDishId(), itemReq.getQuantity());
                }
            }
        }
        order.setItems(orderItems);
        
        order = orderRepository.save(order);

        // Record Payment if applicable
        if (request.getTotalAmount() != null && request.getTotalAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            PaymentTransaction payment = new PaymentTransaction();
            payment.setOrder(order);
            payment.setAmount(request.getTotalAmount());
            payment.setGateway(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
            payment.setStatus("COMPLETED"); // Dummy logic: assume payment completes immediately
            paymentRepository.save(payment);
        }

        return order;
    }

    private void deductInventory(Long dishId, int quantitySold) {
        List<RecipeItem> recipes = recipeItemRepository.findByDishId(dishId);
        for (RecipeItem recipe : recipes) {
            Ingredient ingredient = recipe.getIngredient();
            java.math.BigDecimal deduction = recipe.getQuantityRequired().multiply(new java.math.BigDecimal(quantitySold));
            ingredient.setStockLevel(ingredient.getStockLevel().subtract(deduction));
            ingredientRepository.save(ingredient);
        }
    }

    private String generateOrderNumber() {
        CustomerOrder lastOrder = orderRepository.findTopByOrderByIdDesc();
        int nextId = 1;
        if (lastOrder != null) {
            String[] parts = lastOrder.getOrderNumber().split("-");
            if (parts.length > 1) {
                nextId = Integer.parseInt(parts[1]) + 1;
            } else {
                nextId = lastOrder.getId().intValue() + 1; // Fallback
            }
        }
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "ORD-" + nextId + "-" + dateStr;
    }
}
