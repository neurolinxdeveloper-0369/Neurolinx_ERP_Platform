import os
import re

def fix_branch_prop(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    if "private Branch branch;" in text: return

    # Inject right before public Long getId() (where we already injected getters)
    # Wait, it's safer to inject near the class definition.
    inject_str = """
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Branch branch;
"""
    text = text.replace("public class ", "public class ", 1)
    # let's just use regex to insert after the first {
    text = re.sub(r'public class \w+ \{', lambda m: m.group(0) + inject_str, text)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

models_to_patch = [
    'erp-api/src/main/java/com/neurolinx/erp/model/User.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/Ingredient.java',
    'erp-api/src/main/java/com/neurolinx/erp/model/StockBatch.java'
]

for m in models_to_patch:
    fix_branch_prop(m)

print("Fixed branch prop injection")
