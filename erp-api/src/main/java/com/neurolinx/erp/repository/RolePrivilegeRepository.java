package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Role;
import com.neurolinx.erp.model.RolePrivilege;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolePrivilegeRepository extends JpaRepository<RolePrivilege, Long> {
    List<RolePrivilege> findByRole(Role role);
}
