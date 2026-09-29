import os

path = 'erp-api/src/main/java/com/neurolinx/erp/model/Company.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('public class Company {', 'public class Company {\n    private String subdomain;\n    public String getSubdomain() { return subdomain; }\n    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
