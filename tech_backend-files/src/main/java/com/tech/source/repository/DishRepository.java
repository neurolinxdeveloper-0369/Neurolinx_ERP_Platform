package com.tech.source.repository;
import com.tech.source.model.Dish;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByCompany(Company company);
}