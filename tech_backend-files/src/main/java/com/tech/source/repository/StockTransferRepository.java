package com.tech.source.repository;

import com.tech.source.model.Branch;
import com.tech.source.model.Company;
import com.tech.source.model.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockTransfer> findByCompanyAndSourceBranchOrderByCreatedAtDesc(Company company, Branch sourceBranch);
    List<StockTransfer> findByCompanyAndDestinationBranchOrderByCreatedAtDesc(Company company, Branch destinationBranch);
}
