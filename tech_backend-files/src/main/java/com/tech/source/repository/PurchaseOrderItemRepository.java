package com.tech.source.repository;

import com.tech.source.model.PurchaseOrder;
import com.tech.source.model.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    List<PurchaseOrderItem> findByPurchaseOrder(PurchaseOrder purchaseOrder);
    void deleteByPurchaseOrder(PurchaseOrder purchaseOrder);
}
