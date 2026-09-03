package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menus")

public class MenuController {
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


    @Autowired private UserRepository userRepository;
    @Autowired private RolePrivilegeRepository rolePrivilegeRepository;

    // Temporary method to fetch menus by username until JWT filter is fully implemented
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

        List<RolePrivilege> privileges = rolePrivilegeRepository.findByRole(role);

        // Filter only active master menus and map to a simple DTO structure
        var menus = privileges.stream()
                .filter(p -> p.getMenuItem().getIsMasterEnabled())
                .filter(p -> p.getCanRead())
                .map(p -> java.util.Map.of(
                        "id", p.getMenuItem().getId(),
                        "name", p.getMenuItem().getName(),
                        "route", p.getMenuItem().getFrontendRoute(),
                        "icon", p.getMenuItem().getIcon() != null ? p.getMenuItem().getIcon() : "",
                        "parentId", p.getMenuItem().getParentId() != null ? p.getMenuItem().getParentId() : 0L
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(menus);
    }
}
