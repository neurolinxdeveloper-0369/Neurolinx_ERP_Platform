package com.tech.source.repository;

import com.tech.source.model.StockTransfer;
import com.tech.source.model.StockTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferItemRepository extends JpaRepository<StockTransferItem, Long> {
    List<StockTransferItem> findByTransfer(StockTransfer transfer);
}
