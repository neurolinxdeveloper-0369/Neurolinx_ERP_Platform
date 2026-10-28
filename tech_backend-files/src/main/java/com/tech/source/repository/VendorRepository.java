package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByCompany(Company company);
}
