package com.neurolinx.erp.config;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Configuration
public class DataSeeder {
    
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner initDatabase(
        MenuItemRepository menuItemRepository, 
        RoleRepository roleRepository, 
        RolePrivilegeRepository rolePrivilegeRepository
    ) {
        return args -> {
            try {
                log.info("Checking and seeding Menu Items...");

                // To prevent duplicates and bad routes, we clear and re-create Restaurant menus natively
                List<MenuItem> allMenus = menuItemRepository.findAll();
                boolean needsClean = allMenus.stream().filter(m -> "Restaurant".equals(m.getIndustryType())).count() > 15;
                
                if (needsClean) {
                    log.info("Found duplicate Restaurant menus. Cleaning up...");
                    List<RolePrivilege> allPrivs = rolePrivilegeRepository.findAll();
                    for (RolePrivilege rp : allPrivs) {
                        if (rp.getMenuItem() != null && "Restaurant".equals(rp.getMenuItem().getIndustryType())) {
                            rolePrivilegeRepository.delete(rp);
                        }
                    }
                    for (MenuItem m : allMenus) {
                        if ("Restaurant".equals(m.getIndustryType())) {
                            menuItemRepository.delete(m);
                        }
                    }
                }

                java.util.function.Function<String[], MenuItem> seedMenu = (String[] data) -> {
                    String name = data[0];
                    String route = data[1];
                    String icon = data[2];
                    String industry = data[3];
                    Long parentId = data[4] != null ? Long.parseLong(data[4]) : null;

                    MenuItem item = menuItemRepository.findFirstByNameAndIndustryType(name, industry).orElse(new MenuItem());
                    item.setName(name);
                    item.setFrontendRoute(route);
                    item.setIcon(icon);
                    item.setIndustryType(industry);
                    item.setParentId(parentId);
                    return menuItemRepository.save(item);
                };

                // Seed Restaurant Menus
                MenuItem dashboard = seedMenu.apply(new String[]{"Dashboard", "/res-dashboard", "layout-dashboard", "Restaurant", null});
                MenuItem orders = seedMenu.apply(new String[]{"Orders", "/res-orders", "clipboard-list", "Restaurant", null});
                
                // Inventory Dropdown (Parent)
                MenuItem inventory = seedMenu.apply(new String[]{"Inventory", "#", "archive", "Restaurant", null});
                // Inventory Children
                MenuItem menuMgmt = seedMenu.apply(new String[]{"Menu Management", "/res-inventory", "book", "Restaurant", inventory.getId().toString()});
                MenuItem wasteMgmt = seedMenu.apply(new String[]{"Waste Management", "/res-waste", "trash-2", "Restaurant", inventory.getId().toString()});
                MenuItem vendorMgmt = seedMenu.apply(new String[]{"Vendor Management", "/res-vendors", "users", "Restaurant", inventory.getId().toString()});
                MenuItem rawMat = seedMenu.apply(new String[]{"Raw Material", "/res-raw-materials", "box", "Restaurant", inventory.getId().toString()});
                MenuItem recipeMgmt = seedMenu.apply(new String[]{"Recipe Management", "/res-recipes", "chef-hat", "Restaurant", inventory.getId().toString()});

                // Rest of Restaurant Menus
                MenuItem billing = seedMenu.apply(new String[]{"Billing", "/res-billing", "receipt", "Restaurant", null});
                MenuItem analytics = seedMenu.apply(new String[]{"Analytics", "/res-analytics", "line-chart", "Restaurant", null});
                MenuItem documents = seedMenu.apply(new String[]{"Documents", "/res-documents", "file-text", "Restaurant", null});
                MenuItem staff = seedMenu.apply(new String[]{"Staff", "/res-staff", "user-cog", "Restaurant", null});
                MenuItem support = seedMenu.apply(new String[]{"Support", "/res-support", "life-buoy", "Restaurant", null});
                MenuItem printer = seedMenu.apply(new String[]{"Printer Canvas", "/res-printers", "printer", "Restaurant", null});
                MenuItem settings = seedMenu.apply(new String[]{"Settings", "/res-settings", "settings", "Restaurant", null});
                
                log.info("Menu Items seeded successfully!");

                // Now, assign these to all Company Admins in Restaurant industry
                List<Role> allRoles = roleRepository.findAll();
                List<MenuItem> allResMenus = menuItemRepository.findAll().stream()
                    .filter(m -> "Restaurant".equals(m.getIndustryType())).toList();

                for (Role role : allRoles) {
                    if (role.getCompany() != null && "Restaurant".equals(role.getCompany().getIndustryType()) && "Company Admin".equals(role.getName())) {
                        for (MenuItem menu : allResMenus) {
                            // Check if privilege exists
                            boolean exists = rolePrivilegeRepository.findByRole(role).stream()
                                .anyMatch(p -> p.getMenuItem().getId().equals(menu.getId()));
                            if (!exists) {
                                RolePrivilege rp = new RolePrivilege(role, menu, true, true, true);
                                rolePrivilegeRepository.save(rp);
                            }
                        }
                    }
                }
                log.info("Privileges synced for Restaurant Company Admins!");
            } catch (Exception e) {
                log.error("DataSeeder encountered an error but will not crash the app", e);
            }
        };
    }
}
