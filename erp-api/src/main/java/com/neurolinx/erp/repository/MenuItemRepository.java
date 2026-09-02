package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    Optional<MenuItem> findByName(String name);
    Optional<MenuItem> findByNameAndIndustryType(String name, String industryType);
}
