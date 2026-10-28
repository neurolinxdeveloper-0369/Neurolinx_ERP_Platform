package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.PurchaseOrder;
import com.tech.source.model.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockBatchRepository extends JpaRepository<StockBatch, Long> {
    List<StockBatch> findByCompany(Company company);
    List<StockBatch> findByCompanyAndBranchId(Company company, Long branchId);
    List<StockBatch> findByPurchaseOrder(PurchaseOrder purchaseOrder);
    void deleteByPurchaseOrder(PurchaseOrder purchaseOrder);
}

