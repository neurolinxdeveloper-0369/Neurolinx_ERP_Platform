import os

# 1. Add Company to Ingredient.java
path = 'erp-api/src/main/java/com/neurolinx/erp/model/Ingredient.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

company_inject = """    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Company company;

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
"""
if "Company company" not in text:
    text = text.replace("public Ingredient() {}", company_inject + "\n    public Ingredient() {}")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# 2. Add findByCompany to IngredientRepository.java
path = 'erp-api/src/main/java/com/neurolinx/erp/repository/IngredientRepository.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

if "findByCompany" not in text:
    text = text.replace("public interface IngredientRepository extends JpaRepository<Ingredient, Long> {", "public interface IngredientRepository extends JpaRepository<Ingredient, Long> {\n    java.util.List<com.neurolinx.erp.model.Ingredient> findByCompany(com.neurolinx.erp.model.Company company);\n    java.util.List<com.neurolinx.erp.model.Ingredient> findByCompanyAndBranchId(com.neurolinx.erp.model.Company company, Long branchId);")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# 3. Fix InventoryController.java to use findByCompany
path = 'erp-api/src/main/java/com/neurolinx/erp/controller/InventoryController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

fetch_inject = """    @GetMapping("/ingredients")
    public ResponseEntity<?> getIngredients() {
        com.neurolinx.erp.model.Company company = getUserCompany();
        String branchHeader = request.getHeader("X-Branch-Id");
        if (branchHeader != null && !branchHeader.equals("global")) {
            return ResponseEntity.ok(ingredientRepository.findByCompanyAndBranchId(company, Long.parseLong(branchHeader)));
        }
        return ResponseEntity.ok(ingredientRepository.findByCompany(company));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Map<String, Object> payload) {
        Ingredient ing = new Ingredient();
        ing.setCompany(getUserCompany());
        ing.setName(payload.get("name").toString());"""

text = text.replace("""    @GetMapping("/ingredients")
    public ResponseEntity<?> getIngredients() {
        return ResponseEntity.ok(ingredientRepository.findAll());
    }

    @PostMapping("/ingredients")
    public ResponseEntity<?> addIngredient(@RequestBody Map<String, Object> payload) {
        Ingredient ing = new Ingredient();
        ing.setName(payload.get("name").toString());""", fetch_inject)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched Ingredient multi-tenant")
