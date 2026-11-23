package com.workfora.organization.repository;

import com.workfora.organization.domain.Department;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    org.springframework.data.domain.Page<Department> findByOrganizationId(java.util.UUID organizationId, org.springframework.data.domain.Pageable pageable);
    boolean existsByOrganizationIdAndCodeIgnoreCase(java.util.UUID organizationId, String code);
}
