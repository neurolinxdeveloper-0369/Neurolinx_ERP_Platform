import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure Year is imported
if 'java.time.Year;' not in text:
    text = text.replace('import java.util.Map;', 'import java.util.Map;\nimport java.time.Year;')

old_order_num = 'order.setOrderNumber("ORD-" + System.currentTimeMillis());'
new_order_num = """
        String yearPrefix = String.valueOf(Year.now().getValue()).substring(2);
        String nextSequence = "0001";
        try {
            CustomerOrder lastOrder = orderRepo.findTopByCompanyOrderByIdDesc(company);
            if (lastOrder != null && lastOrder.getOrderNumber() != null && lastOrder.getOrderNumber().startsWith(yearPrefix)) {
                String lastSeqStr = lastOrder.getOrderNumber().substring(2);
                int lastSeq = Integer.parseInt(lastSeqStr);
                nextSequence = String.format("%04d", lastSeq + 1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        order.setOrderNumber(yearPrefix + nextSequence);
"""

text = text.replace(old_order_num, new_order_num)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('PosController patched for sequence order ID')
