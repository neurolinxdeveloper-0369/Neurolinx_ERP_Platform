import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/PosController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_method = """    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepo.findByEmail(email);
        return userOpt.map(user -> user.getRole() != null ? user.getRole().getCompany() : null).orElse(null);
    }"""

new_method = """    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        System.out.println("GETUSERCOMPANY: email=" + email);
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            System.out.println("GETUSERCOMPANY: User not found in DB");
            return null;
        }
        com.neurolinx.erp.model.User user = userOpt.get();
        System.out.println("GETUSERCOMPANY: found user, role=" + (user.getRole() != null ? user.getRole().getName() : "null"));
        com.neurolinx.erp.model.Company comp = user.getRole() != null ? user.getRole().getCompany() : null;
        System.out.println("GETUSERCOMPANY: company=" + (comp != null ? comp.getName() : "null"));
        return comp;
    }"""

text = text.replace(old_method, new_method)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added logging")
