package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Branch;
import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockTransfer> findByCompanyAndSourceBranchOrderByCreatedAtDesc(Company company, Branch sourceBranch);
    List<StockTransfer> findByCompanyAndDestinationBranchOrderByCreatedAtDesc(Company company, Branch destinationBranch);
}
