package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.EmployeeShift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface EmployeeShiftRepository extends JpaRepository<EmployeeShift, Long> {
    List<EmployeeShift> findByCompany(Company company);
    List<EmployeeShift> findByCompanyAndShiftDate(Company company, LocalDate shiftDate);
}
