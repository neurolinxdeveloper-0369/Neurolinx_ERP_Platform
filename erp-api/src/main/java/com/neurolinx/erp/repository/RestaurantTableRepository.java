package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.RestaurantTable;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByCompany(Company company);
}