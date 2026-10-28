package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByCompany(Company company);
    List<Employee> findByCompanyAndIsActiveTrue(Company company);
    java.util.Optional<Employee> findByIdAndCompany(Long id, Company company);
}
