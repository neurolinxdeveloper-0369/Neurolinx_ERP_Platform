package com.neurolinx.erp.dto;

import java.math.BigDecimal;
import java.util.List;

public class CreateOrderRequest {
    private String orderType;
    private String paymentMethod;
    private BigDecimal totalAmount;
    private BigDecimal taxApplied;
    private BigDecimal discountApplied;
    private String status;
    private Long tableId;
    private List<CreateOrderItemRequest> items;

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getTaxApplied() { return taxApplied; }
    public void setTaxApplied(BigDecimal taxApplied) { this.taxApplied = taxApplied; }
    public BigDecimal getDiscountApplied() { return discountApplied; }
    public void setDiscountApplied(BigDecimal discountApplied) { this.discountApplied = discountApplied; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }
    public List<CreateOrderItemRequest> getItems() { return items; }
    public void setItems(List<CreateOrderItemRequest> items) { this.items = items; }
}
