package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Branch;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByCompany(Company company);
    Optional<Branch> findByIdAndCompany(Long id, Company company);
}
