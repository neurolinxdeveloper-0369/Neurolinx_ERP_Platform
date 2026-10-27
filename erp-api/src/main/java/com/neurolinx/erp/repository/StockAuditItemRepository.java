package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.StockAudit;
import com.neurolinx.erp.model.StockAuditItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAuditItemRepository extends JpaRepository<StockAuditItem, Long> {
    List<StockAuditItem> findByAudit(StockAudit audit);
}
