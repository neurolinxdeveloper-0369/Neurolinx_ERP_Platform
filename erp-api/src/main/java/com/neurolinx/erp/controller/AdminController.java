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

    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @PostMapping("/companies")
    public ResponseEntity<Company> createCompany(@RequestBody Company company) {
        return ResponseEntity.ok(companyRepository.save(company));
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
