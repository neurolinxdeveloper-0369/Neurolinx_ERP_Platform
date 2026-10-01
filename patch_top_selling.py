import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/RestaurantController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

top_selling_code = """
        // Calculate Top Selling Items (all time for now, or just from all orders)
        Map<String, Integer> itemSales = new HashMap<>();
        for (CustomerOrder o : allOrders) {
            if ("Completed".equals(o.getStatus())) {
                for (OrderItem item : o.getItems()) {
                    String dName = item.getDishName() != null ? item.getDishName() : (item.getDish() != null ? item.getDish().getName() : "Unknown");
                    itemSales.put(dName, itemSales.getOrDefault(dName, 0) + item.getQuantity());
                }
            }
        }
        List<Map<String, Object>> topSellingItems = itemSales.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(e -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", e.getKey());
                m.put("sales", e.getValue());
                return m;
            })
            .collect(Collectors.toList());

        stats.put("topSellingItems", topSellingItems);
"""

text = text.replace('stats.put("pendingKots", pendingKots);', 'stats.put("pendingKots", pendingKots);\n' + top_selling_code)
text = text.replace('import java.util.Map;', 'import java.util.Map;\nimport java.util.stream.Collectors;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added topSellingItems to RestaurantController")
