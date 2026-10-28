package com.tech.source.repository;

import com.tech.source.model.Role;
import com.tech.source.model.RolePrivilege;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolePrivilegeRepository extends JpaRepository<RolePrivilege, Long> {
    List<RolePrivilege> findByRole(Role role);
}
