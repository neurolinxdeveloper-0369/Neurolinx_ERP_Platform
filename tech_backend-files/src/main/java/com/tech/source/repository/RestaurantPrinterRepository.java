package com.tech.source.repository;
import com.tech.source.model.RestaurantPrinter;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RestaurantPrinterRepository extends JpaRepository<RestaurantPrinter, Long> {
    List<RestaurantPrinter> findByCompany(Company company);
}