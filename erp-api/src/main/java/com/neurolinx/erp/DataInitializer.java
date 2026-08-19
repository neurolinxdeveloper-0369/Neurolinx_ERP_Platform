package com.neurolinx.erp;
import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository, 
            RoleRepository roleRepository, 
            CompanyRepository companyRepository,
            MenuItemRepository menuItemRepository,
            RolePrivilegeRepository rolePrivilegeRepository,
            PasswordEncoder passwordEncoder) {
        
        return args -> {
            // Seed Company
            Company systemCompany = companyRepository.findByName("Neurolinx System").orElseGet(() -> {
                return companyRepository.save(new Company("Neurolinx System", "Software"));
            });

            // Seed Master Admin Role
            Role masterAdmin = roleRepository.findByNameAndCompanyIsNull("Master Admin").orElseGet(() -> {
                return roleRepository.save(new Role("Master Admin", null)); // Global role
            });

            // Seed Core Menu Items
            MenuItem dashboardMenu = menuItemRepository.findByName("Dashboard").orElseGet(() -> {
                return menuItemRepository.save(new MenuItem("Dashboard", "/dashboard", "layout-dashboard"));
            });
            MenuItem clientMenu = menuItemRepository.findByName("Clients").orElseGet(() -> {
                return menuItemRepository.save(new MenuItem("Clients", "/clients", "users"));
            });
            MenuItem settingsMenu = menuItemRepository.findByName("Settings").orElseGet(() -> {
                return menuItemRepository.save(new MenuItem("Settings", "/settings", "settings"));
            });

            // Grant Master Admin Access
            if (rolePrivilegeRepository.findByRole(masterAdmin).isEmpty()) {
                rolePrivilegeRepository.save(new RolePrivilege(masterAdmin, dashboardMenu, true, true, true));
                rolePrivilegeRepository.save(new RolePrivilege(masterAdmin, clientMenu, true, true, true));
                rolePrivilegeRepository.save(new RolePrivilege(masterAdmin, settingsMenu, true, true, true));
            }

            // Seed Default Admin User
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User("admin", passwordEncoder.encode("admin123"));
                admin.setRole(masterAdmin);
                admin.setCompany(systemCompany);
                userRepository.save(admin);
            }
        };
    }
}
