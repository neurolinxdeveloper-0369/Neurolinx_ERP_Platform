import os
import re

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/VendorController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_post = """    @PostMapping
    public ResponseEntity<?> createVendor(@RequestBody Vendor vendor) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        vendor.setCompany(company);
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }"""
new_post = """    @PostMapping
    public ResponseEntity<?> createVendor(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        Vendor vendor = new Vendor();
        vendor.setCompany(company);
        if (payload.containsKey("name")) vendor.setName(payload.get("name").toString());
        if (payload.containsKey("contactPerson")) vendor.setContactPerson(payload.get("contactPerson").toString());
        if (payload.containsKey("phone")) vendor.setPhone(payload.get("phone").toString());
        if (payload.containsKey("email")) vendor.setEmail(payload.get("email").toString());
        if (payload.containsKey("address")) vendor.setAddress(payload.get("address").toString());
        if (payload.containsKey("gstNumber")) vendor.setGstNumber(payload.get("gstNumber").toString());
        
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }"""
text = text.replace(old_post, new_post)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched VendorController")
