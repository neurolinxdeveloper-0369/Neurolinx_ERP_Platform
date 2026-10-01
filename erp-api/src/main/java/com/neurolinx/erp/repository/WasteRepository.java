package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.WasteEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface WasteRepository extends JpaRepository<WasteEntry, Long> {
    List<WasteEntry> findByCompany(Company company);
    List<WasteEntry> findByCompanyAndDateRecorded(Company company, LocalDate dateRecorded);
}
