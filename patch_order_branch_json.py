import os

path = 'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("@com.fasterxml.jackson.annotation.JsonIgnore\n    private Branch branch;", "private Branch branch;")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed JsonIgnore from CustomerOrder.branch")
