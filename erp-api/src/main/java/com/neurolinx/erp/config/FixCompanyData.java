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
public class FixCompanyData {
    private static final Logger log = LoggerFactory.getLogger(FixCompanyData.class);

    @Bean
    CommandLineRunner fixCompanies(CompanyRepository companyRepository, RoleRepository roleRepository, RolePrivilegeRepository rolePrivilegeRepository, MenuItemRepository menuItemRepository) {
        return args -> {
            try {
                // Ensure all companies have industryType Restaurant
                for (Company c : companyRepository.findAll()) {
                    if (c.getIndustryType() == null || c.getIndustryType().isEmpty()) {
                        c.setIndustryType("Restaurant");
                        companyRepository.save(c);
                        log.info("Fixed company: " + c.getName());
                    }
                }

                // Force sync Restaurant menus to ALL Company Admin roles regardless of company industry type (just to be safe)
                List<MenuItem> allResMenus = menuItemRepository.findAll().stream()
                    .filter(m -> "Restaurant".equals(m.getIndustryType())).toList();
                
                for (Role role : roleRepository.findAll()) {
                    if ("Company Admin".equals(role.getName())) {
                        for (MenuItem menu : allResMenus) {
                            boolean exists = rolePrivilegeRepository.findByRole(role).stream()
                                .anyMatch(p -> p.getMenuItem().getId().equals(menu.getId()));
                            if (!exists) {
                                rolePrivilegeRepository.save(new RolePrivilege(role, menu, true, true, true));
                            }
                        }
                    }
                }
                log.info("Emergency privilege sync completed!");

            } catch (Exception e) {
                log.error("Failed to fix company data", e);
            }
        };
    }
}
