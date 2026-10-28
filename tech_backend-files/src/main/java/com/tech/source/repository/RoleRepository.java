package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNameAndCompanyIsNull(String name);
    Optional<Role> findByNameAndCompany(String name, Company company);
}
