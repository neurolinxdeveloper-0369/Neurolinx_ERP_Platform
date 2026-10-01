package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByCompany(Company company);
}
