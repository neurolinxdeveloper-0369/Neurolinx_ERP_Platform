package com.tech.source;

import com.tech.source.model.*;
import com.tech.source.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository, 
            RoleRepository roleRepository, 
            CompanyRepository companyRepository,
            MenuItemRepository menuItemRepository,
            RolePrivilegeRepository rolePrivilegeRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        
        return args -> {
            // 0. Ensure PostgreSQL schema columns exist safely for all inventory entities
            try {
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS company_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS branch_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS reorder_level NUMERIC(38,2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS par_level NUMERIC(38,2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS storage_zone VARCHAR(100) DEFAULT 'Dry Store'");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS barcode VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS preferred_vendor_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(38,2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE ingredients ALTER COLUMN stock_level SET DEFAULT 0");
                jdbcTemplate.execute("UPDATE ingredients SET reorder_level = 0 WHERE reorder_level IS NULL");
                jdbcTemplate.execute("UPDATE ingredients SET par_level = 0 WHERE par_level IS NULL");
                jdbcTemplate.execute("UPDATE ingredients SET storage_zone = 'Dry Store' WHERE storage_zone IS NULL");
                jdbcTemplate.execute("UPDATE ingredients SET cost_per_unit = 0 WHERE cost_per_unit IS NULL");
                jdbcTemplate.execute("UPDATE ingredients SET stock_level = 0 WHERE stock_level IS NULL");
            } catch (Exception e) {
                System.err.println("Migration notice for ingredients: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(38,2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ordered'");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_date DATE");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS notes VARCHAR(500)");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_attachment_url TEXT");
                jdbcTemplate.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_attachment_name VARCHAR(255)");
                jdbcTemplate.execute("UPDATE purchase_orders SET amount_paid = 0 WHERE amount_paid IS NULL");
                jdbcTemplate.execute("UPDATE purchase_orders SET status = 'Ordered' WHERE status IS NULL");
            } catch (Exception e) {
                System.err.println("Migration notice for purchase_orders: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS quantity_received NUMERIC(38,2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20)");
                jdbcTemplate.execute("UPDATE purchase_order_items SET quantity_received = 0 WHERE quantity_received IS NULL");
            } catch (Exception e) {
                System.err.println("Migration notice for purchase_order_items: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE recipe_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20)");
            } catch (Exception e) {
                System.err.println("Migration notice for recipe_items: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS branch_id BIGINT");
            } catch (Exception e) {
                System.err.println("Migration notice for stock_batches: " + e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS branch_id BIGINT");
            } catch (Exception e) {
                System.err.println("Migration notice for stock_movements: " + e.getMessage());
            }

            try {
                // Ensure parent_id is correctly set to Inventory for all inventory submodules
                jdbcTemplate.execute("UPDATE menu_items SET parent_id = (SELECT id FROM menu_items WHERE name = 'Inventory' LIMIT 1) WHERE frontend_route IN ('/res-inventory', '/res-waste', '/res-vendors', '/res-raw-materials', '/res-recipes') AND name != 'Inventory'");
            } catch (Exception e) {
                System.err.println("Notice updating menu_items parent_id: " + e.getMessage());
            }

            // 1. Seed Master Admin Role
            Role masterAdmin = roleRepository.findByNameAndCompanyIsNull("Master Admin").orElseGet(() -> {
                return roleRepository.save(new Role("Master Admin", null)); // Global role
            });

            // 2. Seed Default Admin User
            if (userRepository.findByEmail("neurolinxdeveloper@gmail.com").isEmpty()) {
                User admin = new User("neurolinxdeveloper@gmail.com", passwordEncoder.encode("Neurolinx@2026"));
                admin.setRole(masterAdmin);
                admin.setCompany(null); // System admin does not belong to a client company
                userRepository.save(admin);
            }

            // 3. Seed Standard Restaurant Menu Items
            MenuItem dash = getOrCreateMenu(menuItemRepository, "Dashboard", "/res-dashboard", "layout-dashboard", "Restaurant", null);
            MenuItem orders = getOrCreateMenu(menuItemRepository, "Orders", "/res-orders", "clipboard-list", "Restaurant", null);
            MenuItem kitchen = getOrCreateMenu(menuItemRepository, "Kitchen KDS", "/res-kitchen", "monitor-play", "Restaurant", null);
            MenuItem inv = getOrCreateMenu(menuItemRepository, "Inventory", "/res-inventory", "boxes", "Restaurant", null);
            
            // Inventory Submodules
            MenuItem menuMgmt = getOrCreateMenu(menuItemRepository, "Menu Management", "/res-inventory", "book-open", "Restaurant", inv.getId());
            MenuItem waste = getOrCreateMenu(menuItemRepository, "Waste Management", "/res-waste", "trash-2", "Restaurant", inv.getId());
            MenuItem vendors = getOrCreateMenu(menuItemRepository, "Vendor Management", "/res-vendors", "truck", "Restaurant", inv.getId());
            MenuItem rawMat = getOrCreateMenu(menuItemRepository, "Raw Material", "/res-raw-materials", "apple", "Restaurant", inv.getId());
            MenuItem recipes = getOrCreateMenu(menuItemRepository, "Recipe Management", "/res-recipes", "chef-hat", "Restaurant", inv.getId());

            MenuItem billing = getOrCreateMenu(menuItemRepository, "Billing", "/res-billing", "receipt", "Restaurant", null);
            MenuItem analytics = getOrCreateMenu(menuItemRepository, "Analytics", "/res-analytics", "bar-chart-3", "Restaurant", null);
            MenuItem reports = getOrCreateMenu(menuItemRepository, "Reports", "/res-reports", "file-text", "Restaurant", null);
            MenuItem staff = getOrCreateMenu(menuItemRepository, "Staff", "/res-staff", "users", "Restaurant", null);
            MenuItem branches = getOrCreateMenu(menuItemRepository, "Branches", "/res-branches", "store", "Restaurant", null);
            MenuItem settings = getOrCreateMenu(menuItemRepository, "Settings", "/res-settings", "settings", "Restaurant", null);

            List<MenuItem> allMenus = List.of(dash, orders, kitchen, inv, menuMgmt, waste, vendors, rawMat, recipes, billing, analytics, reports, staff, branches, settings);

            // 4. Auto-grant all standard menu privileges to any Company Admin roles
            List<Role> companyAdminRoles = roleRepository.findAll().stream()
                    .filter(r -> r.getName() != null && r.getName().contains("Admin") && !"Master Admin".equals(r.getName()))
                    .toList();

            for (Role car : companyAdminRoles) {
                var existingPrivs = rolePrivilegeRepository.findByRole(car);
                java.util.Set<Long> assignedIds = existingPrivs.stream()
                        .map(p -> p.getMenuItem().getId())
                        .collect(java.util.stream.Collectors.toSet());

                for (MenuItem m : allMenus) {
                    if (!assignedIds.contains(m.getId())) {
                        try {
                            rolePrivilegeRepository.save(new RolePrivilege(car, m, true, true, true));
                        } catch (Exception ignored) {}
                    }
                }
            }
        };
    }

    private MenuItem getOrCreateMenu(MenuItemRepository repo, String name, String route, String icon, String industry, Long parentId) {
        return repo.findAll().stream()
                .filter(m -> name.equalsIgnoreCase(m.getName()))
                .findFirst()
                .or(() -> repo.findAll().stream().filter(m -> route.equalsIgnoreCase(m.getFrontendRoute())).findFirst())
                .map(existing -> {
                    boolean changed = false;
                    if (parentId != null && (existing.getParentId() == null || !existing.getParentId().equals(parentId))) {
                        existing.setParentId(parentId);
                        changed = true;
                    }
                    if (existing.getIsMasterEnabled() == null || !existing.getIsMasterEnabled()) {
                        existing.setIsMasterEnabled(true);
                        changed = true;
                    }
                    return changed ? repo.save(existing) : existing;
                })
                .orElseGet(() -> {
                    MenuItem item = new MenuItem(name, route, icon);
                    item.setIndustryType(industry);
                    item.setIsMasterEnabled(true);
                    item.setParentId(parentId);
                    return repo.save(item);
                });
    }
}
