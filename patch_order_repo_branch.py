import os

path = 'erp-api/src/main/java/com/neurolinx/erp/repository/CustomerOrderRepository.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_methods = """    List<CustomerOrder> findByCompanyAndBranchId(Company company, Long branchId);
    List<CustomerOrder> findTop10ByCompanyAndBranchIdOrderByIdDesc(Company company, Long branchId);
"""
text = text.replace("    List<CustomerOrder> findByCompany(Company company);", "    List<CustomerOrder> findByCompany(Company company);\n" + new_methods)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched CustomerOrderRepository")
