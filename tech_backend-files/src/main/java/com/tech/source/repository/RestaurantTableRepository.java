package com.tech.source.repository;
import com.tech.source.model.RestaurantTable;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByCompany(Company company);
    List<RestaurantTable> findByCompanyAndFloorOrderByPositionAscIdAsc(Company company, Integer floor);
    List<RestaurantTable> findByCompanyOrderByFloorAscPositionAscIdAsc(Company company);
    Optional<RestaurantTable> findByIdAndCompany(Long id, Company company);
    long countByCompany(Company company);
    long countByCompanyAndStatus(Company company, String status);
    void deleteByCompanyAndFloor(Company company, Integer floor);
}