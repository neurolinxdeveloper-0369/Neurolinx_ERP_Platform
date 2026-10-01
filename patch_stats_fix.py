import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/RestaurantController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('import java.util.*;', 'import java.util.*;\nimport java.util.stream.Collectors;')
text = text.replace('for (CustomerOrder o : allOrders) {', 'List<CustomerOrder> allOrders = orderRepo.findByCompany(company);\n        for (CustomerOrder o : allOrders) {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed RestaurantController")
