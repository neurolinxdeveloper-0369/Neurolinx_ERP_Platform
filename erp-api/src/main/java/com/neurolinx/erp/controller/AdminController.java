package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private CompanyRepository companyRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RolePrivilegeRepository rolePrivilegeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DeviceSessionRepository deviceSessionRepository;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // --- DEVICE SESSIONS ---

    @GetMapping("/pending-devices")
    public ResponseEntity<?> getPendingDevices() {
        return ResponseEntity.ok(deviceSessionRepository.findAll().stream().filter(s -> !s.getIsApproved()).collect(Collectors.toList()));
    }

    @PostMapping("/approve-device/{id}")
    public ResponseEntity<?> approveDevice(@PathVariable Long id) {
        var session = deviceSessionRepository.findById(id).orElseThrow();
        session.setIsApproved(true);
        deviceSessionRepository.save(session);
        return ResponseEntity.ok().build();
    }

    // --- MENU ITEMS (Global Modules) ---
    
    @GetMapping("/menu-items")
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuItemRepository.findAll());
    }

    @PostMapping("/menu-items")
    public ResponseEntity<MenuItem> createMenuItem(@RequestBody MenuItem menuItem) {
        if (menuItem.getIndustryType() == null) menuItem.setIndustryType("All");
        return ResponseEntity.ok(menuItemRepository.save(menuItem));
    }

    @PutMapping("/menu-items/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem updatedItem) {
        return menuItemRepository.findById(id).map(item -> {
            item.setName(updatedItem.getName());
            item.setFrontendRoute(updatedItem.getFrontendRoute());
            item.setIcon(updatedItem.getIcon());
            item.setIsMasterEnabled(updatedItem.getIsMasterEnabled());
            item.setIndustryType(updatedItem.getIndustryType() != null ? updatedItem.getIndustryType() : "All");
            return ResponseEntity.ok(menuItemRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/menu-items/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- COMPANIES (Clients) ---

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
            company.setLogoBase64(updatedCompany.getLogoBase64());
            company.setContactNumber(updatedCompany.getContactNumber());
            company.setAddress(updatedCompany.getAddress());
            company.setClientName(updatedCompany.getClientName());
            company.setWebsiteUrl(updatedCompany.getWebsiteUrl());
            company.setTotalTables(updatedCompany.getTotalTables());
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
        company.setLogoBase64(dto.getLogoBase64());
        company.setContactNumber(dto.getContactNumber());
        company.setAddress(dto.getAddress());
        company.setClientName(dto.getClientName());
        company.setWebsiteUrl(dto.getWebsiteUrl());
        company.setTotalTables(dto.getTotalTables());
        company = companyRepository.save(company);

        // 2. Create Default "Company Admin" Role for this client
        Role clientAdminRole = new Role("Company Admin", company);
        clientAdminRole = roleRepository.save(clientAdminRole);

        // 3. Create the Admin User
        User adminUser = new User(dto.getEmail(), passwordEncoder.encode(dto.getPassword()));
        adminUser.setCompany(company);
        adminUser.setRole(clientAdminRole);
        userRepository.save(adminUser);

        return ResponseEntity.ok(company);
    }

    // --- ROLES & PRIVILEGES (Client Provisioning) ---

    @GetMapping("/companies/{companyId}/roles")
    public ResponseEntity<List<Role>> getCompanyRoles(@PathVariable Long companyId) {
        return ResponseEntity.ok(roleRepository.findAll().stream()
                .filter(r -> r.getCompany() != null && r.getCompany().getId().equals(companyId))
                .collect(Collectors.toList()));
    }

    @PostMapping("/companies/{companyId}/roles")
    public ResponseEntity<?> createCompanyRole(@PathVariable Long companyId, @RequestBody Role role) {
        return companyRepository.findById(companyId).map(company -> {
            role.setCompany(company);
            return ResponseEntity.ok(roleRepository.save(role));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @PostMapping("/role-privileges")
    public ResponseEntity<RolePrivilege> assignPrivilege(@RequestBody RolePrivilege privilege) {
        return ResponseEntity.ok(rolePrivilegeRepository.save(privilege));
    }

    // --- COMPANY MODULE ASSIGNMENT ---

    @GetMapping("/companies/{companyId}/modules")
    public ResponseEntity<List<Long>> getCompanyModules(@PathVariable Long companyId) {
        Role adminRole = roleRepository.findAll().stream()
                .filter(r -> r.getCompany() != null && r.getCompany().getId().equals(companyId) && "Company Admin".equals(r.getName()))
                .findFirst()
                .orElse(null);
        
        if (adminRole == null) return ResponseEntity.notFound().build();

        List<Long> assignedModuleIds = rolePrivilegeRepository.findByRole(adminRole).stream()
                .map(p -> p.getMenuItem().getId())
                .toList();
                
        return ResponseEntity.ok(assignedModuleIds);
    }

    @PostMapping("/companies/{companyId}/modules")
    public ResponseEntity<?> updateCompanyModules(@PathVariable Long companyId, @RequestBody List<Long> moduleIds) {
        Role adminRole = roleRepository.findAll().stream()
                .filter(r -> r.getCompany() != null && r.getCompany().getId().equals(companyId) && "Company Admin".equals(r.getName()))
                .findFirst()
                .orElse(null);
        
        if (adminRole == null) return ResponseEntity.notFound().build();

        // Remove old privileges
        List<RolePrivilege> existing = rolePrivilegeRepository.findByRole(adminRole);
        rolePrivilegeRepository.deleteAll(existing);

        // Add new privileges
        for (Long moduleId : moduleIds) {
            menuItemRepository.findById(moduleId).ifPresent(menuItem -> {
                RolePrivilege rp = new RolePrivilege(adminRole, menuItem, true, true, true);
                rolePrivilegeRepository.save(rp);
            });
        }
        
        return ResponseEntity.ok().build();
    }
}
