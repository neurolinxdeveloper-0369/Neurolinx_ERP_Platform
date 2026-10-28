package com.tech.source.repository;
import com.tech.source.model.RestaurantSettings;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RestaurantSettingsRepository extends JpaRepository<RestaurantSettings, Long> {
    Optional<RestaurantSettings> findByCompany(Company company);
}