import os

# 1. Update BranchRepository.java
path_repo = 'erp-api/src/main/java/com/neurolinx/erp/repository/BranchRepository.java'
with open(path_repo, 'r', encoding='utf-8') as f:
    text = f.read()

repo_methods = """    List<Branch> findByCompany(Company company);
    Optional<Branch> findByIdAndCompany(Long id, Company company);
    Optional<Branch> findByUrbanpiperStoreId(String urbanpiperStoreId);
    Optional<Branch> findBySwiggyOutletId(String swiggyOutletId);
    Optional<Branch> findByZomatoRestaurantId(String zomatoRestaurantId);"""

text = text.replace("""    List<Branch> findByCompany(Company company);
    Optional<Branch> findByIdAndCompany(Long id, Company company);""", repo_methods)

with open(path_repo, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update BranchController.java
path_ctrl = 'erp-api/src/main/java/com/neurolinx/erp/controller/BranchController.java'
with open(path_ctrl, 'r', encoding='utf-8') as f:
    text = f.read()

create_fields = """        if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));
        if (payload.containsKey("swiggyOutletId") && payload.get("swiggyOutletId") != null) branch.setSwiggyOutletId(payload.get("swiggyOutletId").toString());
        if (payload.containsKey("zomatoRestaurantId") && payload.get("zomatoRestaurantId") != null) branch.setZomatoRestaurantId(payload.get("zomatoRestaurantId").toString());
        if (payload.containsKey("urbanpiperStoreId") && payload.get("urbanpiperStoreId") != null) branch.setUrbanpiperStoreId(payload.get("urbanpiperStoreId").toString());
        if (payload.containsKey("autoAcceptOrders") && payload.get("autoAcceptOrders") != null) branch.setAutoAcceptOrders(Boolean.parseBoolean(payload.get("autoAcceptOrders").toString()));
        if (payload.containsKey("onlineOrderingActive") && payload.get("onlineOrderingActive") != null) branch.setOnlineOrderingActive(Boolean.parseBoolean(payload.get("onlineOrderingActive").toString()));"""

update_fields = """            if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));
            if (payload.containsKey("swiggyOutletId")) branch.setSwiggyOutletId(payload.get("swiggyOutletId") != null ? payload.get("swiggyOutletId").toString() : null);
            if (payload.containsKey("zomatoRestaurantId")) branch.setZomatoRestaurantId(payload.get("zomatoRestaurantId") != null ? payload.get("zomatoRestaurantId").toString() : null);
            if (payload.containsKey("urbanpiperStoreId")) branch.setUrbanpiperStoreId(payload.get("urbanpiperStoreId") != null ? payload.get("urbanpiperStoreId").toString() : null);
            if (payload.containsKey("autoAcceptOrders") && payload.get("autoAcceptOrders") != null) branch.setAutoAcceptOrders(Boolean.parseBoolean(payload.get("autoAcceptOrders").toString()));
            if (payload.containsKey("onlineOrderingActive") && payload.get("onlineOrderingActive") != null) branch.setOnlineOrderingActive(Boolean.parseBoolean(payload.get("onlineOrderingActive").toString()));"""

text = text.replace('        if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));', create_fields)
text = text.replace('            if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));', update_fields)

with open(path_ctrl, 'w', encoding='utf-8') as f:
    f.write(text)

# 3. Update SecurityConfig.java
path_sec = 'erp-api/src/main/java/com/neurolinx/erp/security/SecurityConfig.java'
with open(path_sec, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('.requestMatchers("/api/menus/debug-privileges/**").permitAll()', '.requestMatchers("/api/menus/debug-privileges/**").permitAll()\n                .requestMatchers("/api/aggregators/webhook/**").permitAll()')

with open(path_sec, 'w', encoding='utf-8') as f:
    f.write(text)

print("Branch and Security config patched successfully")
