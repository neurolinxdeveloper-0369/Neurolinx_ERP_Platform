package com.tech.source.model;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customer_orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomerOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String orderNumber;
    @Column(nullable = false)
    private String orderType;
    @Column(nullable = false)
    private String status = "Pending";
    private BigDecimal totalAmount;
    private String paymentMethod;

    @Column(length = 50)
    private String kitchenStatus = "Pending"; // Pending, Preparing, Ready, Completed
    @Column(length = 500)
    private String notes;
    @Column(length = 30)
    private String orderSource = "POS"; // POS, QR
    private BigDecimal discountApplied = BigDecimal.ZERO;
    private BigDecimal taxApplied = BigDecimal.ZERO;

    // Delivery & Aggregator Specific Fields
    @Column(length = 100)
    private String customerName;

    @Column(length = 30)
    private String customerPhone;

    @Column(length = 255)
    private String deliveryAddress;

    @Column(length = 100)
    private String deliveryArea;

    @Column(length = 100)
    private String deliveryCity;

    @Column(length = 20)
    private String deliveryPostalCode;

    @Column(length = 500)
    private String deliveryInstructions;

    @Column(length = 50)
    private String deliveryStatus; // Order Placed, Preparing, Ready for Dispatch, Out for Delivery, Delivered, Cancelled

    private Long deliveryStaffId;

    @Column(length = 100)
    private String deliveryStaffName;

    @Column(length = 30)
    private String deliveryStaffPhone;

    @Column(length = 100)
    private String deliveryAssignedBy;

    private LocalDateTime deliveryAssignedAt;

    private Integer estimatedPrepMinutes;

    private LocalDateTime expectedReadyTime;

    private Integer estimatedDeliveryMinutes;

    private LocalDateTime expectedDeliveryTime;

    private LocalDateTime dispatchedAt;

    private LocalDateTime deliveredAt;
    private Boolean inventoryDeducted = false;
    private Boolean inventoryRestored = false;

    private String externalOrderId;
    private String deliveryRiderName;
    private String deliveryRiderPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable restaurantTable;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;

    public CustomerOrder() {}
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public RestaurantTable getRestaurantTable() { return restaurantTable; }
    public void setRestaurantTable(RestaurantTable restaurantTable) { this.restaurantTable = restaurantTable; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    
    public String getKitchenStatus() { return kitchenStatus; }
    public void setKitchenStatus(String kitchenStatus) { this.kitchenStatus = kitchenStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public BigDecimal getDiscountApplied() { return discountApplied; }
    public void setDiscountApplied(BigDecimal discountApplied) { this.discountApplied = discountApplied; }
    public BigDecimal getTaxApplied() { return taxApplied; }
    public void setTaxApplied(BigDecimal taxApplied) { this.taxApplied = taxApplied; }
    public String getOrderSource() { return orderSource; }
    public void setOrderSource(String orderSource) { this.orderSource = orderSource; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getDeliveryArea() { return deliveryArea; }
    public void setDeliveryArea(String deliveryArea) { this.deliveryArea = deliveryArea; }

    public String getDeliveryCity() { return deliveryCity; }
    public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }

    public String getDeliveryPostalCode() { return deliveryPostalCode; }
    public void setDeliveryPostalCode(String deliveryPostalCode) { this.deliveryPostalCode = deliveryPostalCode; }

    public String getDeliveryInstructions() { return deliveryInstructions; }
    public void setDeliveryInstructions(String deliveryInstructions) { this.deliveryInstructions = deliveryInstructions; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public Long getDeliveryStaffId() { return deliveryStaffId; }
    public void setDeliveryStaffId(Long deliveryStaffId) { this.deliveryStaffId = deliveryStaffId; }

    public String getDeliveryStaffName() { return deliveryStaffName; }
    public void setDeliveryStaffName(String deliveryStaffName) { this.deliveryStaffName = deliveryStaffName; }

    public String getDeliveryStaffPhone() { return deliveryStaffPhone; }
    public void setDeliveryStaffPhone(String deliveryStaffPhone) { this.deliveryStaffPhone = deliveryStaffPhone; }

    public String getDeliveryAssignedBy() { return deliveryAssignedBy; }
    public void setDeliveryAssignedBy(String deliveryAssignedBy) { this.deliveryAssignedBy = deliveryAssignedBy; }

    public LocalDateTime getDeliveryAssignedAt() { return deliveryAssignedAt; }
    public void setDeliveryAssignedAt(LocalDateTime deliveryAssignedAt) { this.deliveryAssignedAt = deliveryAssignedAt; }

    public Integer getEstimatedPrepMinutes() { return estimatedPrepMinutes; }
    public void setEstimatedPrepMinutes(Integer estimatedPrepMinutes) { this.estimatedPrepMinutes = estimatedPrepMinutes; }

    public LocalDateTime getExpectedReadyTime() { return expectedReadyTime; }
    public void setExpectedReadyTime(LocalDateTime expectedReadyTime) { this.expectedReadyTime = expectedReadyTime; }

    public Integer getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }

    public LocalDateTime getExpectedDeliveryTime() { return expectedDeliveryTime; }
    public void setExpectedDeliveryTime(LocalDateTime expectedDeliveryTime) { this.expectedDeliveryTime = expectedDeliveryTime; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public Boolean getInventoryDeducted() { return inventoryDeducted != null ? inventoryDeducted : false; }
    public void setInventoryDeducted(Boolean inventoryDeducted) { this.inventoryDeducted = inventoryDeducted; }

    public Boolean getInventoryRestored() { return inventoryRestored != null ? inventoryRestored : false; }
    public void setInventoryRestored(Boolean inventoryRestored) { this.inventoryRestored = inventoryRestored; }

    public String getExternalOrderId() { return externalOrderId; }
    public void setExternalOrderId(String externalOrderId) { this.externalOrderId = externalOrderId; }
    public String getDeliveryRiderName() { return deliveryRiderName; }
    public void setDeliveryRiderName(String deliveryRiderName) { this.deliveryRiderName = deliveryRiderName; }
    public String getDeliveryRiderPhone() { return deliveryRiderPhone; }
    public void setDeliveryRiderPhone(String deliveryRiderPhone) { this.deliveryRiderPhone = deliveryRiderPhone; }
}