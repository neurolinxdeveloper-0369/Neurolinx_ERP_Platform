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
            // Seed Master Admin Role
            Role masterAdmin = roleRepository.findByNameAndCompanyIsNull("Master Admin").orElseGet(() -> {
                return roleRepository.save(new Role("Master Admin", null)); // Global role
            });

            // Seed Default Admin User
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User("admin", passwordEncoder.encode("admin123"));
                admin.setRole(masterAdmin);
                admin.setCompany(null); // System admin does not belong to a client company
                userRepository.save(admin);
            }
        };
    }
}
