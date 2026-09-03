package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.RestaurantSettings;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RestaurantSettingsRepository extends JpaRepository<RestaurantSettings, Long> {
    Optional<RestaurantSettings> findByCompany(Company company);
}