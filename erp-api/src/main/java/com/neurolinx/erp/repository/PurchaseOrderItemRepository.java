package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.PurchaseOrder;
import com.neurolinx.erp.model.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    List<PurchaseOrderItem> findByPurchaseOrder(PurchaseOrder purchaseOrder);
    void deleteByPurchaseOrder(PurchaseOrder purchaseOrder);
}
