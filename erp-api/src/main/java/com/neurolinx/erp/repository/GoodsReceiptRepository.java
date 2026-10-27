package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.GoodsReceipt;
import com.neurolinx.erp.model.PurchaseOrder;
import com.neurolinx.erp.model.Vendor;
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
