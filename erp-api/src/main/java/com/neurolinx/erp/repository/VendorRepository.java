package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByCompany(Company company);
}
