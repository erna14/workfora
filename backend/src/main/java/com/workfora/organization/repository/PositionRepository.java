package com.workfora.organization.repository;

import com.workfora.organization.domain.OrgUnitStatus;
import com.workfora.organization.domain.Position;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PositionRepository extends JpaRepository<Position, UUID> {

    Optional<Position> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByDepartmentId(UUID departmentId);

    boolean existsByDepartmentIdAndTitleIgnoreCase(UUID departmentId, String title);

    boolean existsByDepartmentIdAndTitleIgnoreCaseAndIdNot(UUID departmentId, String title, UUID id);

    @Query("""
            SELECT p.departmentId, COUNT(p.id)
            FROM Position p
            WHERE p.departmentId IN :ids
            GROUP BY p.departmentId
            """)
    List<Object[]> countGroupedByDepartmentId(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT p FROM Position p
            WHERE p.organizationId = :orgId
              AND (:applyDepartment = false OR p.departmentId = :departmentId)
              AND (:applyStatus = false OR p.status = :status)
              AND (
                   :search = '' OR
                   LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(p.level, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Position> search(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("applyDepartment") boolean applyDepartment,
            @Param("departmentId") UUID departmentId,
            @Param("applyStatus") boolean applyStatus,
            @Param("status") OrgUnitStatus status,
            Pageable pageable
    );
}
