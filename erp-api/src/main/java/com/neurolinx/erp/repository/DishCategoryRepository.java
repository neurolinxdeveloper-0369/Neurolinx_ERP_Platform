package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.DishCategory;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DishCategoryRepository extends JpaRepository<DishCategory, Long> {
    List<DishCategory> findByCompany(Company company);
}