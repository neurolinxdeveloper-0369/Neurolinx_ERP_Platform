package com.tech.source.controller;

import com.tech.source.model.*;
import com.tech.source.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    @Autowired private UserRepository userRepository;
    @Autowired private RolePrivilegeRepository rolePrivilegeRepository;
    @Autowired private MenuItemRepository menuItemRepository;

    @GetMapping("/debug-privileges/{email}")
    public ResponseEntity<?> debugPrivileges(@PathVariable String email) {
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.ok("User not found");
        
        User user = userOpt.get();
        Role role = user.getRole();
        if (role == null) return ResponseEntity.ok("No role for user");
        
        var privs = rolePrivilegeRepository.findByRole(role).stream().map(p -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("menuName", p.getMenuItem().getName());
            map.put("menuId", p.getMenuItem().getId());
            map.put("parentId", p.getMenuItem().getParentId());
            map.put("canRead", p.getCanRead());
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(privs);
    }

    // Fetch menus by username / email with auto-grant fallback for Company Admins
    @GetMapping("/my-menus/{email}")
    public ResponseEntity<?> getMyMenus(@PathVariable String email) {
        var userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();
        Role role = user.getRole();

        if (role == null) {
            return ResponseEntity.ok(List.of());
        }

        List<RolePrivilege> privileges = new java.util.ArrayList<>(rolePrivilegeRepository.findByRole(role));

        // If no privileges assigned yet (unconfigured role), auto-grant active modules for industry
        if (privileges.isEmpty()) {
            String industry = (user.getCompany() != null && user.getCompany().getIndustryType() != null)
                    ? user.getCompany().getIndustryType()
                    : "Restaurant";
            
            java.util.Set<Long> alreadyAssigned = privileges.stream()
                    .map(p -> p.getMenuItem().getId())
                    .collect(Collectors.toSet());

            List<MenuItem> allActive = menuItemRepository.findAll().stream()
                    .filter(MenuItem::getIsMasterEnabled)
                    .filter(m -> "All".equalsIgnoreCase(m.getIndustryType()) || industry.equalsIgnoreCase(m.getIndustryType()))
                    .collect(Collectors.toList());
            
            for (MenuItem item : allActive) {
                if (!alreadyAssigned.contains(item.getId())) {
                    try {
                        RolePrivilege rp = new RolePrivilege(role, item, true, true, true);
                        rolePrivilegeRepository.save(rp);
                        privileges.add(rp);
                        alreadyAssigned.add(item.getId());
                    } catch (Exception ignored) {}
                }
            }
        }

        // Filter only active master menus, sort by predefined fixed order, and map to a null-safe DTO structure
        var menus = privileges.stream()
                .filter(p -> p.getMenuItem() != null && Boolean.TRUE.equals(p.getMenuItem().getIsMasterEnabled()))
                .filter(p -> Boolean.TRUE.equals(p.getCanRead()))
                .sorted(java.util.Comparator.comparingInt(p -> getPredefinedMenuOrder(p.getMenuItem())))
                .map(p -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", p.getMenuItem().getId());
                    map.put("name", p.getMenuItem().getName() != null ? p.getMenuItem().getName() : "");
                    map.put("route", p.getMenuItem().getFrontendRoute() != null ? p.getMenuItem().getFrontendRoute() : "");
                    map.put("icon", p.getMenuItem().getIcon() != null ? p.getMenuItem().getIcon() : "");
                    map.put("parentId", p.getMenuItem().getParentId() != null ? p.getMenuItem().getParentId() : 0L);
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(menus);
    }

    public static int getPredefinedMenuOrder(MenuItem item) {
        if (item == null) return 9999;
        String name = item.getName() != null ? item.getName().trim().toLowerCase() : "";
        String route = item.getFrontendRoute() != null ? item.getFrontendRoute().trim().toLowerCase() : "";

        if (name.equals("dashboard") || route.contains("dashboard")) return 10;
        if (name.equals("orders") || route.contains("orders")) return 20;
        if (name.contains("kitchen") || name.contains("kds") || route.contains("kitchen")) return 30;
        if (name.equals("inventory") || route.equals("#") || (route.contains("inventory") && item.getParentId() == null)) return 40;
        if (name.contains("menu management")) return 41;
        if (name.contains("waste")) return 42;
        if (name.contains("vendor")) return 43;
        if (name.contains("raw")) return 44;
        if (name.contains("recipe")) return 45;
        if (name.contains("billing") || route.contains("billing")) return 50;
        if (name.contains("analytic") || route.contains("analytic")) return 60;
        if (name.contains("report") || route.contains("report")) return 70;
        if (name.contains("document") || route.contains("document")) return 80;
        if (name.contains("staff") || route.contains("staff")) return 90;
        if (name.contains("support") || route.contains("support")) return 100;
        if (name.contains("printer") || route.contains("printer")) return 110;
        if (name.contains("branch") || route.contains("branch")) return 120;
        if (name.contains("setting") || route.contains("setting")) return 130;
        if (name.contains("qr") || route.contains("qr")) return 140;

        return item.getId() != null ? 1000 + item.getId().intValue() : 9999;
    }
}
