package com.tech.source.repository;

import com.tech.source.model.StockAudit;
import com.tech.source.model.StockAuditItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAuditItemRepository extends JpaRepository<StockAuditItem, Long> {
    List<StockAuditItem> findByAudit(StockAudit audit);
}
