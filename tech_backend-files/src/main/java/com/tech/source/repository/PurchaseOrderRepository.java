package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.PurchaseOrder;
import com.tech.source.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByCompany(Company company);
    List<PurchaseOrder> findByVendor(Vendor vendor);
    void deleteByVendor(Vendor vendor);
}

