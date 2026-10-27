package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.StockTransfer;
import com.neurolinx.erp.model.StockTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferItemRepository extends JpaRepository<StockTransferItem, Long> {
    List<StockTransferItem> findByTransfer(StockTransfer transfer);
}
