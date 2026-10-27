import os

path = 'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Resolve first conflict marker in fields
conflict1_target = """<<<<<<< HEAD
    // Delivery Specific Fields
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
=======
    private String externalOrderId;
    private String customerName;
    private String customerPhone;
    private String deliveryRiderName;
    private String deliveryRiderPhone;
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)"""

conflict1_repl = """    // Delivery & Aggregator Specific Fields
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
    private String deliveryRiderPhone;"""

text = text.replace(conflict1_target, conflict1_repl)

# Resolve second conflict marker in getters/setters
conflict2_target = """    public Boolean getInventoryRestored() { return inventoryRestored != null ? inventoryRestored : false; }
    public void setInventoryRestored(Boolean inventoryRestored) { this.inventoryRestored = inventoryRestored; }
=======
    public String getExternalOrderId() { return externalOrderId; }
    public void setExternalOrderId(String externalOrderId) { this.externalOrderId = externalOrderId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getDeliveryRiderName() { return deliveryRiderName; }
    public void setDeliveryRiderName(String deliveryRiderName) { this.deliveryRiderName = deliveryRiderName; }
    public String getDeliveryRiderPhone() { return deliveryRiderPhone; }
    public void setDeliveryRiderPhone(String deliveryRiderPhone) { this.deliveryRiderPhone = deliveryRiderPhone; }
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)"""

conflict2_repl = """    public Boolean getInventoryRestored() { return inventoryRestored != null ? inventoryRestored : false; }
    public void setInventoryRestored(Boolean inventoryRestored) { this.inventoryRestored = inventoryRestored; }

    public String getExternalOrderId() { return externalOrderId; }
    public void setExternalOrderId(String externalOrderId) { this.externalOrderId = externalOrderId; }
    public String getDeliveryRiderName() { return deliveryRiderName; }
    public void setDeliveryRiderName(String deliveryRiderName) { this.deliveryRiderName = deliveryRiderName; }
    public String getDeliveryRiderPhone() { return deliveryRiderPhone; }
    public void setDeliveryRiderPhone(String deliveryRiderPhone) { this.deliveryRiderPhone = deliveryRiderPhone; }"""

text = text.replace(conflict2_target, conflict2_repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("CustomerOrder.java resolved cleanly")
