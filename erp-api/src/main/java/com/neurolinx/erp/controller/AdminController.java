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

    @PutMapping("/menu-items/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem updatedItem) {
        return menuItemRepository.findById(id).map(item -> {
            item.setName(updatedItem.getName());
            item.setFrontendRoute(updatedItem.getFrontendRoute());
            item.setIcon(updatedItem.getIcon());
            item.setIsMasterEnabled(updatedItem.getIsMasterEnabled());
            return ResponseEntity.ok(menuItemRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/menu-items/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- COMPANIES (Clients) ---

    @Autowired private UserRepository userRepository;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable Long id, @RequestBody Company updatedCompany) {
        return companyRepository.findById(id).map(company -> {
            company.setName(updatedCompany.getName());
            company.setIndustryType(updatedCompany.getIndustryType());
            company.setIsActive(updatedCompany.getIsActive());
            return ResponseEntity.ok(companyRepository.save(company));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        companyRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
