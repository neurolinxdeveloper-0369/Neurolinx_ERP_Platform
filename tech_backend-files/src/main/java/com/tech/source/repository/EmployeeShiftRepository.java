package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.EmployeeShift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface EmployeeShiftRepository extends JpaRepository<EmployeeShift, Long> {
    List<EmployeeShift> findByCompany(Company company);
    List<EmployeeShift> findByCompanyAndShiftDate(Company company, LocalDate shiftDate);
}
