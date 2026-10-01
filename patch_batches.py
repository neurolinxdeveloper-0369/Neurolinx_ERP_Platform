import os

# 1. Update StockBatchRepository
path_repo = 'erp-api/src/main/java/com/neurolinx/erp/repository/StockBatchRepository.java'
with open(path_repo, 'r', encoding='utf-8') as f:
    repo_text = f.read()

repo_text = repo_text.replace("List<StockBatch> findByCompany(Company company);", "List<StockBatch> findByCompany(Company company);\n    List<StockBatch> findByCompanyAndBranchId(Company company, Long branchId);")

with open(path_repo, 'w', encoding='utf-8') as f:
    f.write(repo_text)

# 2. Update InventoryController
path_ctrl = 'erp-api/src/main/java/com/neurolinx/erp/controller/InventoryController.java'
with open(path_ctrl, 'r', encoding='utf-8') as f:
    ctrl_text = f.read()

ctrl_inject = """    @Autowired private com.neurolinx.erp.repository.StockBatchRepository stockBatchRepository;
    @Autowired private com.neurolinx.erp.repository.UserRepository userRepository;
    @Autowired private jakarta.servlet.http.HttpServletRequest request;

    private com.neurolinx.erp.model.Company getUserCompany() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(com.neurolinx.erp.model.User::getCompany).orElseThrow();
    }

    @GetMapping("/batches")
    public org.springframework.http.ResponseEntity<?> getBatches() {
        com.neurolinx.erp.model.Company company = getUserCompany();
        String branchHeader = request.getHeader("X-Branch-Id");
        if (branchHeader != null && !branchHeader.equals("global")) {
            return org.springframework.http.ResponseEntity.ok(stockBatchRepository.findByCompanyAndBranchId(company, Long.parseLong(branchHeader)));
        }
        return org.springframework.http.ResponseEntity.ok(stockBatchRepository.findByCompany(company));
    }
"""

# Find where to inject in InventoryController
# Before `@GetMapping("/ingredients")`
ctrl_text = ctrl_text.replace("@GetMapping(\"/ingredients\")", ctrl_inject + "\n    @GetMapping(\"/ingredients\")")

with open(path_ctrl, 'w', encoding='utf-8') as f:
    f.write(ctrl_text)

print("Patched Inventory API")
