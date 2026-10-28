package com.tech.source.repository;

import com.tech.source.model.Branch;
import com.tech.source.model.Company;
import com.tech.source.model.StockAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAuditRepository extends JpaRepository<StockAudit, Long> {
    List<StockAudit> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockAudit> findByCompanyAndBranchOrderByCreatedAtDesc(Company company, Branch branch);
}
