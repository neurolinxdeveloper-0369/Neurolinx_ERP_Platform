import os

path = 'erp-api/src/main/java/com/neurolinx/erp/model/RestaurantSettings.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_fields = """
    private String currencySymbol = "₹";
    private String openingTime = "09:00";
    private String closingTime = "22:00";

    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }
    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }
    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }
"""

text = text.replace('public class RestaurantSettings {', 'public class RestaurantSettings {' + new_fields)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated RestaurantSettings.java")
