package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNameAndCompanyIsNull(String name);
    Optional<Role> findByNameAndCompany(String name, Company company);
}
