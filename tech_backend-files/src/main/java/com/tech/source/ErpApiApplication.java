package com.tech.source;

import com.tech.source.model.Company;
import com.tech.source.model.RestaurantTable;
import com.tech.source.repository.CompanyRepository;
import com.tech.source.repository.RestaurantTableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@SpringBootApplication
public class ErpApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ErpApiApplication.class, args);
	}

	@Bean
	public CommandLineRunner cleanupLegacyFloors(
			CompanyRepository companyRepo,
			RestaurantTableRepository tableRepo,
			JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				List<Company> companies = companyRepo.findAll();
				for (Company c : companies) {
					// Normalize companies with legacy 2 floors or null to 1 floor
					if (c.getTotalFloors() == null || c.getTotalFloors() == 2) {
						c.setTotalFloors(1);
						if (c.getTotalTables() == null || c.getTotalTables() > 5 || c.getTotalTables() < 1) {
							c.setTotalTables(5);
						}
						companyRepo.save(c);
					}

					int maxFloors = (c.getTotalFloors() != null && c.getTotalFloors() > 0) ? c.getTotalFloors() : 1;
					List<RestaurantTable> tables = tableRepo.findByCompany(c);
					for (RestaurantTable t : tables) {
						if (t.getFloor() != null && t.getFloor() > maxFloors) {
							try {
								jdbcTemplate.update("UPDATE customer_orders SET table_id = NULL WHERE table_id = ?", t.getId());
								tableRepo.delete(t);
							} catch (Exception ignored) {}
						}
					}
				}
			} catch (Exception e) {
				System.err.println("cleanupLegacyFloors notice: " + e.getMessage());
			}
		};
	}

}
