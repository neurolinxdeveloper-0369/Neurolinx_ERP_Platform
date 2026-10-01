import os

path = 'erp-frontend/src/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add X-Branch-Id
header_injection = """  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const branchId = localStorage.getItem('activeBranchId');
  if (branchId && branchId !== 'global') {
    headers.set('X-Branch-Id', branchId);
  }"""

text = text.replace("""  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }""", header_injection)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched api.ts with X-Branch-Id")
