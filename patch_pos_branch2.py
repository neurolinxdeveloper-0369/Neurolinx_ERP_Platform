import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# I will inject right before `private Company getUserCompany()`
req_injection = """
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

text = text.replace("    private Company getUserCompany() {", req_injection + "\n    private Company getUserCompany() {")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched PosController correctly")
