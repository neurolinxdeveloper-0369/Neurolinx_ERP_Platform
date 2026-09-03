package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.RestaurantPrinter;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RestaurantPrinterRepository extends JpaRepository<RestaurantPrinter, Long> {
    List<RestaurantPrinter> findByCompany(Company company);
}