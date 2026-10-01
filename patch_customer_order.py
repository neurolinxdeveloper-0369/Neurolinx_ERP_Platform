import os

path = 'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add kitchenStatus property
old_prop = """    private String paymentMethod;
"""
new_prop = """    private String paymentMethod;

    @Column(length = 50)
    private String kitchenStatus = "Pending"; // Pending, Preparing, Ready, Delivered
"""
text = text.replace(old_prop, new_prop)

# Add getters and setters
old_getters = """    public String getPaymentMethod() { return paymentMethod; }"""
new_getters = """    public String getKitchenStatus() { return kitchenStatus; }
    public void setKitchenStatus(String kitchenStatus) { this.kitchenStatus = kitchenStatus; }

    public String getPaymentMethod() { return paymentMethod; }"""
text = text.replace(old_getters, new_getters)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched CustomerOrder.java")
