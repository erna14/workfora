package com.workfora.asset.repository;

import com.workfora.asset.domain.AssetAssignment;
import com.workfora.asset.dto.OpenAssignment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, UUID> {
    Optional<AssetAssignment> findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(UUID assetId);

    List<AssetAssignment> findByAssetIdOrderByAssignedAtAsc(UUID assetId);

    Page<AssetAssignment> findByEmployeeId(UUID employeeId, Pageable pageable);

    @Query("""
            select new com.workfora.asset.dto.OpenAssignment(
                a.assetId, e.id, e.firstName, e.lastName, e.employeeNumber, a.assignedAt)
            from AssetAssignment a, com.workfora.employee.domain.Employee e
            where e.id = a.employeeId
              and a.returnedAt is null
              and a.assetId in :assetIds
              and e.organizationId = :organizationId
            """)
    List<OpenAssignment> findOpenAssignments(
            @Param("assetIds") Collection<UUID> assetIds,
            @Param("organizationId") UUID organizationId
    );
}
