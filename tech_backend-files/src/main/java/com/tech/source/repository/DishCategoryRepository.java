package com.tech.source.repository;
import com.tech.source.model.DishCategory;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DishCategoryRepository extends JpaRepository<DishCategory, Long> {
    List<DishCategory> findByCompany(Company company);
}