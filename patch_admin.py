import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/AdminController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("@Autowired private UserRepository userRepository;", "@Autowired private UserRepository userRepository;\n    @Autowired private BranchRepository branchRepository;")

create_logic = """        // 3. Create the Admin User
        User adminUser = new User(dto.getEmail(), passwordEncoder.encode(dto.getPassword()));
        adminUser.setCompany(company);
        adminUser.setRole(clientAdminRole);
        userRepository.save(adminUser);

        // 4. Create Branches (if any)
        if (dto.getBranches() != null && !dto.getBranches().isEmpty()) {
            for (java.util.Map<String, String> b : dto.getBranches()) {
                Branch branch = new Branch();
                branch.setName(b.get("name"));
                branch.setLocation(b.get("location"));
                branch.setCompany(company);
                branchRepository.save(branch);
            }
        }

        return ResponseEntity.ok(company);"""

text = text.replace("""        // 3. Create the Admin User
        User adminUser = new User(dto.getEmail(), passwordEncoder.encode(dto.getPassword()));
        adminUser.setCompany(company);
        adminUser.setRole(clientAdminRole);
        userRepository.save(adminUser);

        return ResponseEntity.ok(company);""", create_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched AdminController with branches")
