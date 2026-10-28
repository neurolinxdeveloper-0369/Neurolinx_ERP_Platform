package com.tech.source.repository;

import com.tech.source.model.Branch;
import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByCompany(Company company);
    Optional<Branch> findByIdAndCompany(Long id, Company company);
    Optional<Branch> findByUrbanpiperStoreId(String urbanpiperStoreId);
    Optional<Branch> findBySwiggyOutletId(String swiggyOutletId);
    Optional<Branch> findByZomatoRestaurantId(String zomatoRestaurantId);
}
