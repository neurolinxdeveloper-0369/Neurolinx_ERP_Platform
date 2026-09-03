package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.Dish;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByCompany(Company company);
}