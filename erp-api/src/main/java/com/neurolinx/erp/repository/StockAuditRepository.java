package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Branch;
import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.StockAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAuditRepository extends JpaRepository<StockAudit, Long> {
    List<StockAudit> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockAudit> findByCompanyAndBranchOrderByCreatedAtDesc(Company company, Branch branch);
}
