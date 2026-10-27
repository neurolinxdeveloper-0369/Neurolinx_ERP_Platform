import os

# 1. Update Branch.java
path_branch = 'erp-api/src/main/java/com/neurolinx/erp/model/Branch.java'
with open(path_branch, 'r', encoding='utf-8') as f:
    text = f.read()

target_fields = """    @Column(nullable = false)
    private Boolean isActive = true;"""

replacement_fields = """    @Column(nullable = false)
    private Boolean isActive = true;

    private String swiggyOutletId;
    private String zomatoRestaurantId;
    private String urbanpiperStoreId;
    private Boolean autoAcceptOrders = true;
    private Boolean onlineOrderingActive = true;"""

text = text.replace(target_fields, replacement_fields)

getters = """    public String getSwiggyOutletId() { return swiggyOutletId; }
    public void setSwiggyOutletId(String swiggyOutletId) { this.swiggyOutletId = swiggyOutletId; }
    public String getZomatoRestaurantId() { return zomatoRestaurantId; }
    public void setZomatoRestaurantId(String zomatoRestaurantId) { this.zomatoRestaurantId = zomatoRestaurantId; }
    public String getUrbanpiperStoreId() { return urbanpiperStoreId; }
    public void setUrbanpiperStoreId(String urbanpiperStoreId) { this.urbanpiperStoreId = urbanpiperStoreId; }
    public Boolean getAutoAcceptOrders() { return autoAcceptOrders; }
    public void setAutoAcceptOrders(Boolean autoAcceptOrders) { this.autoAcceptOrders = autoAcceptOrders; }
    public Boolean getOnlineOrderingActive() { return onlineOrderingActive; }
    public void setOnlineOrderingActive(Boolean onlineOrderingActive) { this.onlineOrderingActive = onlineOrderingActive; }
}"""

text = text[:-1].rstrip() + "\n\n" + getters

with open(path_branch, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update CustomerOrder.java
path_order = 'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java'
with open(path_order, 'r', encoding='utf-8') as f:
    order_text = f.read()

order_target = """    private BigDecimal discountApplied = BigDecimal.ZERO;
    private BigDecimal taxApplied = BigDecimal.ZERO;"""

order_repl = """    private BigDecimal discountApplied = BigDecimal.ZERO;
    private BigDecimal taxApplied = BigDecimal.ZERO;

    private String externalOrderId;
    private String customerName;
    private String customerPhone;
    private String deliveryRiderName;
    private String deliveryRiderPhone;"""

order_text = order_text.replace(order_target, order_repl)

order_getters = """    public String getExternalOrderId() { return externalOrderId; }
    public void setExternalOrderId(String externalOrderId) { this.externalOrderId = externalOrderId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getDeliveryRiderName() { return deliveryRiderName; }
    public void setDeliveryRiderName(String deliveryRiderName) { this.deliveryRiderName = deliveryRiderName; }
    public String getDeliveryRiderPhone() { return deliveryRiderPhone; }
    public void setDeliveryRiderPhone(String deliveryRiderPhone) { this.deliveryRiderPhone = deliveryRiderPhone; }
}"""

order_text = order_text[:-1].rstrip() + "\n\n" + order_getters

with open(path_order, 'w', encoding='utf-8') as f:
    f.write(order_text)

print("Updated Branch.java and CustomerOrder.java with aggregator fields")
