package com.workfora.organization.repository;

import com.workfora.organization.domain.Department;
import com.workfora.organization.domain.OrgUnitStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Optional<Department> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);

    boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);

    boolean existsByOrganizationIdAndCodeIgnoreCaseAndIdNot(UUID organizationId, String code, UUID id);

    boolean existsByOrganizationIdAndNameIgnoreCaseAndIdNot(UUID organizationId, String name, UUID id);

    boolean existsByParentId(UUID parentId);

    @Query("""
            SELECT d FROM Department d
            WHERE d.organizationId = :orgId
              AND (:applyStatus = false OR d.status = :status)
              AND (
                   :search = '' OR
                   LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(d.code) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Department> search(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("applyStatus") boolean applyStatus,
            @Param("status") OrgUnitStatus status,
            Pageable pageable
    );
}
