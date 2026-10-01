import os
import re

def add_branch_to_entity(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Don't add if already exists
    if "private Branch branch;" in text:
        return
        
    prop = """
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @JsonIgnore
    private Branch branch;
"""
    getters = """
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
"""

    text = text.replace("public class", prop + "\npublic class", 1) # This is a bit risky. Let's find a better place.

# Safer replacement:
def add_branch(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    if "private Branch branch;" in text: return

    # Inject before created_at or similar field
    inject_point1 = "private LocalDateTime createdAt"
    if inject_point1 in text:
        text = text.replace(inject_point1, """@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Branch branch;

    """ + inject_point1)
    
    inject_point2 = "public Long getId()"
    if inject_point2 in text:
        text = text.replace(inject_point2, """public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    """ + inject_point2)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

models_to_patch = [
    'erp-api/src/main/java/com/neurolinx/erp/model/CustomerOrder.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/Ingredient.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/StockBatch.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/Employee.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/EmployeeShift.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/User.java'
]

for m in models_to_patch:
    add_branch(m)

print("Patched models with Branch mapping")
