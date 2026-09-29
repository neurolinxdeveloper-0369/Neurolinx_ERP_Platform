package com.neurolinx.erp.service;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final CompanyRepository companyRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public AdminService(CompanyRepository companyRepository, RoleRepository roleRepository,
                        UserRepository userRepository, PasswordEncoder passwordEncoder,
                        JdbcTemplate jdbcTemplate) {
        this.companyRepository = companyRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public Company createCompany(CompanyProvisionDTO dto) {
        // 1. Create Company
        Company company = new Company(dto.getCompanyName(), dto.getIndustryType());
        company.setLogoBase64(dto.getLogoBase64());
        company.setContactNumber(dto.getContactNumber());
        company.setAddress(dto.getAddress());
        company.setClientName(dto.getClientName());
        company.setWebsiteUrl(dto.getWebsiteUrl());
        company.setTotalTables(dto.getTotalTables());
        // set dummy subdomain for now based on name
        if (dto.getCompanyName() != null) {
            company.setSubdomain(dto.getCompanyName().toLowerCase().replaceAll("[^a-z0-9]", ""));
        }
        company = companyRepository.save(company);

        // 2. Create Default "Company Admin" Role for this client
        Role clientAdminRole = new Role("Company Admin", company);
        clientAdminRole = roleRepository.save(clientAdminRole);

        // 3. Create the Admin User
        User adminUser = new User(dto.getEmail(), passwordEncoder.encode(dto.getPassword()));
        adminUser.setCompany(company);
        adminUser.setRole(clientAdminRole);
        userRepository.save(adminUser);

        // 4. Create the Tenant Schema and Tables
        createTenantSchema(company.getId());

        return company;
    }
    
    @Transactional
    public void deleteCompany(Long id) {
        // JPA cascading will handle deleting Users and Roles because of @OneToMany in Company.java
        companyRepository.deleteById(id);
        
        // Also drop the schema
        String schemaName = "tenant_" + id;
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
    }

    private void createTenantSchema(Long companyId) {
        String schemaName = "tenant_" + companyId;
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
        
        // Switch to the new schema to create tables
        // In PostgreSQL, you can prepend the schema name to the table creations or set search_path
        jdbcTemplate.execute("SET search_path TO " + schemaName);

        // 1. DishCategory
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS dish_categories (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "name VARCHAR(255) NOT NULL" +
                ")");
                
        // 2. Dish
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS dishes (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "name VARCHAR(255) NOT NULL, " +
                "description VARCHAR(255), " +
                "price NUMERIC(38, 2) NOT NULL, " +
                "is_available BOOLEAN NOT NULL DEFAULT TRUE, " +
                "stock_level VARCHAR(255), " +
                "image_base64 TEXT, " +
                "is_todays_special BOOLEAN, " +
                "discount_percentage NUMERIC(38, 2), " +
                "category_id BIGINT REFERENCES dish_categories(id)" +
                ")");

        // 3. RestaurantTable
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS restaurant_tables (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "table_name VARCHAR(255) NOT NULL, " +
                "capacity INT, " +
                "status VARCHAR(255) DEFAULT 'Free'" +
                ")");
                
        // 4. CustomerOrder
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS customer_orders (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "order_number VARCHAR(255) NOT NULL UNIQUE, " +
                "order_type VARCHAR(255) NOT NULL, " +
                "status VARCHAR(255) DEFAULT 'Pending', " +
                "total_amount NUMERIC(38, 2), " +
                "payment_method VARCHAR(255), " +
                "discount_applied NUMERIC(38, 2), " +
                "tax_applied NUMERIC(38, 2), " +
                "created_at TIMESTAMP NOT NULL, " +
                "table_id BIGINT REFERENCES restaurant_tables(id)" +
                ")");

        // 5. OrderItem
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS order_items (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "dish_name VARCHAR(255) NOT NULL, " +
                "quantity INT NOT NULL, " +
                "price NUMERIC(38, 2) NOT NULL, " +
                "notes VARCHAR(255), " +
                "status VARCHAR(255), " +
                "order_id BIGINT REFERENCES customer_orders(id) ON DELETE CASCADE" +
                ")");

        // 6. RestaurantPrinter
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS restaurant_printers (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "name VARCHAR(255) NOT NULL, " +
                "printer_type VARCHAR(255) NOT NULL, " +
                "connection_type VARCHAR(255), " +
                "device_identifier VARCHAR(255)" +
                ")");

        // 7. RestaurantSettings
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS restaurant_settings (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "store_name VARCHAR(255), " +
                "gst_number VARCHAR(255), " +
                "address TEXT, " +
                "receipt_footer TEXT, " +
                "default_tax_rate NUMERIC(38, 2), " +
                "default_discount NUMERIC(38, 2), " +
                "upi_qr_image_base64 TEXT" +
                ")");

        // 8. Ingredients (new)
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS ingredients (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "name VARCHAR(255) NOT NULL, " +
                "stock_level NUMERIC(38, 2) NOT NULL, " +
                "unit VARCHAR(50) NOT NULL" +
                ")");

        // 9. RecipeItems (new)
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS recipe_items (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "dish_id BIGINT REFERENCES dishes(id) ON DELETE CASCADE, " +
                "ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE CASCADE, " +
                "quantity_required NUMERIC(38, 2) NOT NULL" +
                ")");
                
        // Reset search path
        jdbcTemplate.execute("SET search_path TO public");
    }
}
