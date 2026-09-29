package com.neurolinx.erp.dto;

import java.math.BigDecimal;

public class CreateOrderItemRequest {
    private String dishName;
    private Long dishId; // To look up recipes
    private Integer quantity;
    private BigDecimal price;
    private String notes;

    public String getDishName() { return dishName; }
    public void setDishName(String dishName) { this.dishName = dishName; }
    public Long getDishId() { return dishId; }
    public void setDishId(Long dishId) { this.dishId = dishId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
