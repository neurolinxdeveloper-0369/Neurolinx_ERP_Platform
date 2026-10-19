package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.PurchaseOrder;
import com.neurolinx.erp.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByCompany(Company company);
    List<PurchaseOrder> findByVendor(Vendor vendor);
    void deleteByVendor(Vendor vendor);
}

