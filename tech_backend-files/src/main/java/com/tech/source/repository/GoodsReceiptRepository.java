package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.GoodsReceipt;
import com.tech.source.model.PurchaseOrder;
import com.tech.source.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    List<GoodsReceipt> findByCompanyOrderByCreatedAtDesc(Company company);
    List<GoodsReceipt> findByPurchaseOrderOrderByCreatedAtDesc(PurchaseOrder purchaseOrder);
    List<GoodsReceipt> findByVendorOrderByCreatedAtDesc(Vendor vendor);
    boolean existsByPurchaseOrderAndInvoiceNumberIgnoreCase(PurchaseOrder purchaseOrder, String invoiceNumber);
    boolean existsByVendorAndInvoiceNumberIgnoreCase(Vendor vendor, String invoiceNumber);
}
