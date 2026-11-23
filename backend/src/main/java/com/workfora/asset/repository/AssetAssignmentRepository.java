package com.workfora.asset.repository;
import com.workfora.asset.domain.AssetAssignment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, UUID> {
    Optional<AssetAssignment> findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(UUID assetId);
    Page<AssetAssignment> findByEmployeeId(UUID employeeId, Pageable pageable);
}
