package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")

public class AdminController {

    @Autowired private JdbcTemplate jdbcTemplate;

    @Autowired private CompanyRepository companyRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RolePrivilegeRepository rolePrivilegeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private DeviceSessionRepository deviceSessionRepository;
    @Autowired private RestaurantTableRepository tableRepo;
    @Autowired private CustomerOrderRepository orderRepo;
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
    public ResponseEntity<?> getCompanies() {
        // Return lightweight list without the heavy logoBase64 field
        java.util.List<Company> list = companyRepository.findAll();
        var dtoList = list.stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("industryType", c.getIndustryType());
            map.put("isActive", c.getIsActive());
            map.put("contactNumber", c.getContactNumber());
            map.put("address", c.getAddress());
            map.put("clientName", c.getClientName());
            map.put("websiteUrl", c.getWebsiteUrl());
            map.put("totalTables", c.getTotalTables());
            map.put("totalFloors", c.getTotalFloors());
            map.put("bypassDeviceLimit", c.getBypassDeviceLimit());
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<?> getCompany(@PathVariable Long id) {
        return companyRepository.findById(id).map(company -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", company.getId());
            map.put("name", company.getName());
            map.put("industryType", company.getIndustryType());
            map.put("isActive", company.getIsActive());
            map.put("logoBase64", company.getLogoBase64());
            map.put("contactNumber", company.getContactNumber());
            map.put("address", company.getAddress());
            map.put("clientName", company.getClientName());
            map.put("websiteUrl", company.getWebsiteUrl());
            map.put("totalTables", company.getTotalTables());
            map.put("totalFloors", company.getTotalFloors());
            map.put("gstin", company.getGstin());
            map.put("panNumber", company.getPanNumber());
            map.put("registrationNumber", company.getRegistrationNumber());
            map.put("foodLicense", company.getFoodLicense());
            map.put("operatingHours", company.getOperatingHours());
            map.put("serviceModel", company.getServiceModel());
            map.put("kitchenSetup", company.getKitchenSetup());
            map.put("bypassDeviceLimit", company.getBypassDeviceLimit());

            int floors = (company.getTotalFloors() != null && company.getTotalFloors() > 0) ? company.getTotalFloors() : 1;
            List<RestaurantTable> tables = tableRepo.findByCompanyOrderByFloorAscPositionAscIdAsc(company);
            java.util.Map<Integer, Long> floorCounts = tables.stream()
                    .filter(t -> t.getFloor() != null && t.getFloor() <= floors && t.getPosition() != null)
                    .collect(Collectors.groupingBy(RestaurantTable::getFloor, Collectors.counting()));

            List<java.util.Map<String, Object>> floorTables = new java.util.ArrayList<>();
            for (int f = 1; f <= floors; f++) {
                java.util.Map<String, Object> ft = new java.util.HashMap<>();
                ft.put("floor", f);
                ft.put("tableCount", floorCounts.getOrDefault(f, 0L).intValue());
                floorTables.add(ft);
            }
            map.put("floorTables", floorTables);

            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/companies/{id}")
    @Transactional
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        return companyRepository.findById(id).map(company -> {
            if (payload.containsKey("name") && payload.get("name") != null) company.setName(payload.get("name").toString());
            if (payload.containsKey("industryType")) company.setIndustryType(payload.get("industryType") != null ? payload.get("industryType").toString() : null);
            if (payload.containsKey("isActive") && payload.get("isActive") != null) company.setIsActive(Boolean.parseBoolean(payload.get("isActive").toString()));
            if (payload.containsKey("logoBase64")) company.setLogoBase64(payload.get("logoBase64") != null ? payload.get("logoBase64").toString() : null);
            if (payload.containsKey("contactNumber")) company.setContactNumber(payload.get("contactNumber") != null ? payload.get("contactNumber").toString() : null);
            if (payload.containsKey("address")) company.setAddress(payload.get("address") != null ? payload.get("address").toString() : null);
            if (payload.containsKey("clientName")) company.setClientName(payload.get("clientName") != null ? payload.get("clientName").toString() : null);
            if (payload.containsKey("websiteUrl")) company.setWebsiteUrl(payload.get("websiteUrl") != null ? payload.get("websiteUrl").toString() : null);

            Integer totalFloors = 1;
            if (payload.get("totalFloors") != null && !payload.get("totalFloors").toString().isBlank()) {
                try { totalFloors = Integer.parseInt(payload.get("totalFloors").toString()); } catch (Exception ignored) {}
            }
            Integer totalTables = 0;
            if (payload.get("totalTables") != null && !payload.get("totalTables").toString().isBlank()) {
                try { totalTables = Integer.parseInt(payload.get("totalTables").toString()); } catch (Exception ignored) {}
            }
            company.setTotalFloors(totalFloors);
            company.setTotalTables(totalTables);

            if (payload.containsKey("gstin")) company.setGstin(payload.get("gstin") != null ? payload.get("gstin").toString() : null);
            if (payload.containsKey("panNumber")) company.setPanNumber(payload.get("panNumber") != null ? payload.get("panNumber").toString() : null);
            if (payload.containsKey("registrationNumber")) company.setRegistrationNumber(payload.get("registrationNumber") != null ? payload.get("registrationNumber").toString() : null);
            if (payload.containsKey("foodLicense")) company.setFoodLicense(payload.get("foodLicense") != null ? payload.get("foodLicense").toString() : null);
            if (payload.containsKey("operatingHours")) company.setOperatingHours(payload.get("operatingHours") != null ? payload.get("operatingHours").toString() : null);
            if (payload.containsKey("serviceModel")) company.setServiceModel(payload.get("serviceModel") != null ? payload.get("serviceModel").toString() : null);
            if (payload.containsKey("kitchenSetup")) company.setKitchenSetup(payload.get("kitchenSetup") != null ? payload.get("kitchenSetup").toString() : null);

            Company saved = companyRepository.save(company);

            if (payload.containsKey("floorTables")) {
                List<java.util.Map<String, Object>> floorTables = (List<java.util.Map<String, Object>>) payload.get("floorTables");
                provisionCompanyTables(saved, totalFloors, totalTables, floorTables);
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/companies/{id}/bypass-limit")
    public ResponseEntity<Company> toggleBypassLimit(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> payload) {
        return companyRepository.findById(id).map(company -> {
            company.setBypassDeviceLimit(payload.get("bypass"));
            return ResponseEntity.ok(companyRepository.save(company));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        try {
            // 1. Employee Shifts & Employees
            jdbcTemplate.update("DELETE FROM employee_shifts WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM employees WHERE company_id = ?", id);

            // 2. Inventory (Waste Entries, Stock Batches, Purchase Orders, Vendors, Recipe Items, Ingredients)
            jdbcTemplate.update("DELETE FROM waste_entries WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM stock_batches WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM purchase_orders WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM vendors WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM recipe_items WHERE dish_id IN (SELECT id FROM dishes WHERE company_id = ?) OR ingredient_id IN (SELECT id FROM ingredients WHERE company_id = ?)", id, id);
            jdbcTemplate.update("DELETE FROM ingredients WHERE company_id = ?", id);

            // 3. Payments & Orders
            jdbcTemplate.update("DELETE FROM payment_transactions WHERE order_id IN (SELECT id FROM customer_orders WHERE company_id = ?)", id);
            jdbcTemplate.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM customer_orders WHERE company_id = ?)", id);
            jdbcTemplate.update("DELETE FROM customer_orders WHERE company_id = ?", id);

            // 4. Restaurant Settings (Dishes, Categories, Tables, Settings, Printers)
            jdbcTemplate.update("DELETE FROM dishes WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM dish_categories WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM restaurant_tables WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM restaurant_settings WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM restaurant_printers WHERE company_id = ?", id);
            
            // 5. Auth & Users (Device Sessions, Users, Role Privileges, Roles)
            jdbcTemplate.update("DELETE FROM device_sessions WHERE email IN (SELECT email FROM users WHERE company_id = ?)", id);
            jdbcTemplate.update("DELETE FROM users WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM role_privileges WHERE role_id IN (SELECT id FROM roles WHERE company_id = ?)", id);
            jdbcTemplate.update("DELETE FROM roles WHERE company_id = ?", id);

            // 6. Subscriptions & Branches
            jdbcTemplate.update("DELETE FROM company_subscriptions WHERE company_id = ?", id);
            jdbcTemplate.update("DELETE FROM branches WHERE company_id = ?", id);
            
            companyRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("message", e.getMessage(), "error", e.toString()));
        }
    }

    @PostMapping("/companies")
    @Transactional
    public ResponseEntity<?> createCompany(@RequestBody CompanyProvisionDTO dto) {
        // 1. Create Company
        Company company = new Company(dto.getCompanyName(), dto.getIndustryType());
        company.setLogoBase64(dto.getLogoBase64());
        company.setContactNumber(dto.getContactNumber());
        company.setAddress(dto.getAddress());
        company.setClientName(dto.getClientName());
        company.setWebsiteUrl(dto.getWebsiteUrl());
        company.setTotalTables(dto.getTotalTables() != null ? dto.getTotalTables() : 0);
        company.setTotalFloors(dto.getTotalFloors() != null ? dto.getTotalFloors() : 1);
        company.setGstin(dto.getGstin());
        company.setPanNumber(dto.getPanNumber());
        company.setRegistrationNumber(dto.getRegistrationNumber());
        company.setFoodLicense(dto.getFoodLicense());
        company.setOperatingHours(dto.getOperatingHours());
        company.setServiceModel(dto.getServiceModel());
        company.setKitchenSetup(dto.getKitchenSetup());
        company = companyRepository.save(company);

        // 2. Create Default "Company Admin" Role for this client
        Role clientAdminRole = new Role("Company Admin", company);
        clientAdminRole = roleRepository.save(clientAdminRole);

        // 3. Create the Admin User
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

        // 5. Provision Tables for the specified floors and tables
        provisionCompanyTables(company, company.getTotalFloors(), company.getTotalTables(), dto.getFloorTables());

        return ResponseEntity.ok(company);
    }

    @Transactional
    public void provisionCompanyTables(Company company, Integer totalFloors, Integer totalTables, List<java.util.Map<String, Object>> floorTables) {
        if (totalFloors == null || totalFloors < 1) totalFloors = 1;

        java.util.Map<Integer, Integer> targetCounts = new java.util.HashMap<>();
        if (floorTables != null && !floorTables.isEmpty()) {
            for (java.util.Map<String, Object> ft : floorTables) {
                if (ft.containsKey("floor") && ft.containsKey("tableCount") && ft.get("tableCount") != null) {
                    try {
                        int floor = Integer.parseInt(ft.get("floor").toString());
                        int count = Integer.parseInt(ft.get("tableCount").toString());
                        targetCounts.put(floor, Math.max(0, count));
                    } catch (Exception ignored) {}
                }
            }
        } else if (totalTables != null && totalTables > 0) {
            int perFloor = totalTables / totalFloors;
            int remainder = totalTables % totalFloors;
            for (int f = 1; f <= totalFloors; f++) {
                targetCounts.put(f, perFloor + (f <= remainder ? 1 : 0));
            }
        }

        for (int f = 1; f <= totalFloors; f++) {
            int targetCount = targetCounts.getOrDefault(f, 0);
            List<RestaurantTable> existing = tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(company, f);

            for (int i = 0; i < targetCount; i++) {
                RestaurantTable t;
                if (i < existing.size()) {
                    t = existing.get(i);
                } else {
                    t = new RestaurantTable();
                    t.setCompany(company);
                    t.setFloor(f);
                    t.setStatus("Free");
                }
                if (t.getTableName() == null || t.getTableName().isBlank() || t.getTableName().startsWith("Table ") || t.getTableName().equals("Unmapped Table")) {
                    t.setTableName("Table " + (i + 1));
                }
                if (t.getCapacity() == null || t.getCapacity() < 1) {
                    t.setCapacity(4);
                }
                t.setPosition(i + 1);
                if (t.getStatus() == null) {
                    t.setStatus("Free");
                }
                tableRepo.save(t);
            }

            if (existing.size() > targetCount) {
                for (int i = targetCount; i < existing.size(); i++) {
                    RestaurantTable surplus = existing.get(i);
                    try {
                        if (jdbcTemplate != null) {
                            jdbcTemplate.update("UPDATE customer_orders SET table_id = NULL WHERE table_id = ?", surplus.getId());
                        }
                        tableRepo.delete(surplus);
                    } catch (Exception ignored) {}
                }
            }
        }

        // Clean up surplus floors beyond totalFloors
        List<RestaurantTable> allTables = tableRepo.findByCompany(company);
        for (RestaurantTable t : allTables) {
            if (t.getFloor() != null && t.getFloor() > totalFloors) {
                try {
                    if (jdbcTemplate != null) {
                        jdbcTemplate.update("UPDATE customer_orders SET table_id = NULL WHERE table_id = ?", t.getId());
                    }
                    tableRepo.delete(t);
                } catch (Exception ignored) {}
            }
        }
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
