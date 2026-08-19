package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private CompanyRepository companyRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RolePrivilegeRepository rolePrivilegeRepository;

    // --- MENU ITEMS (Global Modules) ---
    
    @GetMapping("/menu-items")
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuItemRepository.findAll());
    }

    @PostMapping("/menu-items")
    public ResponseEntity<MenuItem> createMenuItem(@RequestBody MenuItem menuItem) {
        return ResponseEntity.ok(menuItemRepository.save(menuItem));
    }

    // --- COMPANIES (Clients) ---

    @Autowired private UserRepository userRepository;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @PostMapping("/companies")
    public ResponseEntity<?> createCompany(@RequestBody CompanyProvisionDTO dto) {
        // 1. Create Company
        Company company = new Company(dto.getCompanyName(), dto.getIndustryType());
        company = companyRepository.save(company);

        // 2. Create Default "Company Admin" Role for this client
        Role clientAdminRole = new Role("Company Admin", company);
        clientAdminRole = roleRepository.save(clientAdminRole);

        // 3. Create the Admin User
        User adminUser = new User(dto.getUsername(), passwordEncoder.encode(dto.getPassword()));
        adminUser.setCompany(company);
        adminUser.setRole(clientAdminRole);
        userRepository.save(adminUser);

        return ResponseEntity.ok(company);
    }

    // --- ROLES & PRIVILEGES (Client Provisioning) ---

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        // If the role JSON contains a company object with an ID, it will automatically link it
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @PostMapping("/role-privileges")
    public ResponseEntity<RolePrivilege> assignPrivilege(@RequestBody RolePrivilege privilege) {
        return ResponseEntity.ok(rolePrivilegeRepository.save(privilege));
    }
}
