import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add request context autowiring
req_injection = """    @Autowired private IngredientRepository ingredientRepo;
    @Autowired private RecipeItemRepository recipeRepo;
    @Autowired private BranchRepository branchRepo;
    @Autowired private jakarta.servlet.http.HttpServletRequest request;

    private Long getBranchId() {
        String header = request.getHeader("X-Branch-Id");
        if (header != null && !header.isEmpty() && !header.equals("global")) {
            try { return Long.parseLong(header); } catch (Exception e) {}
        }
        return null;
    }
"""
text = text.replace("    @Autowired private IngredientRepository ingredientRepo;\n    @Autowired private RecipeItemRepository recipeRepo;", req_injection)


# Update /orders/all
old_all = """    @GetMapping("/orders/all")
    public ResponseEntity<?> getAllOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));
        return ResponseEntity.ok(orderRepo.findByCompany(company));
    }"""
new_all = """    @GetMapping("/orders/all")
    public ResponseEntity<?> getAllOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user"));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(orderRepo.findByCompanyAndBranchId(company, branchId));
        }
        return ResponseEntity.ok(orderRepo.findByCompany(company));
    }"""
text = text.replace(old_all, new_all)

# Update /orders/recent
old_recent = """    @GetMapping("/orders/recent")
    public ResponseEntity<?> getRecentOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(orderRepo.findTop10ByCompanyOrderByIdDesc(company));
    }"""
new_recent = """    @GetMapping("/orders/recent")
    public ResponseEntity<?> getRecentOrders() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(java.util.Map.of("message", "Company not found for user: " + SecurityContextHolder.getContext().getAuthentication().getName()));
        Long branchId = getBranchId();
        if (branchId != null) {
            return ResponseEntity.ok(orderRepo.findTop10ByCompanyAndBranchIdOrderByIdDesc(company, branchId));
        }
        return ResponseEntity.ok(orderRepo.findTop10ByCompanyOrderByIdDesc(company));
    }"""
text = text.replace(old_recent, new_recent)

# Update POST /orders
old_post = """        order.setRestaurantTable(table);
        order.setPaymentMethod(payload.getOrDefault("paymentMethod", "Cash").toString());
        order.setStatus(payload.getOrDefault("status", "Completed").toString());
        
        CustomerOrder savedOrder = orderRepo.save(order);"""
new_post = """        order.setRestaurantTable(table);
        order.setPaymentMethod(payload.getOrDefault("paymentMethod", "Cash").toString());
        order.setStatus(payload.getOrDefault("status", "Completed").toString());
        
        Long branchId = getBranchId();
        if (branchId != null) {
            branchRepo.findById(branchId).ifPresent(order::setBranch);
        }
        
        CustomerOrder savedOrder = orderRepo.save(order);"""
text = text.replace(old_post, new_post)


with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController to filter by branch")
