package com.workfora.asset.repository;

import com.workfora.asset.domain.Asset;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Page<Asset> findByOrganizationIdAndArchivedAtIsNull(UUID organizationId, Pageable pageable);

    Page<Asset> findByOrganizationIdAndArchivedAtIsNotNull(UUID organizationId, Pageable pageable);

    Optional<Asset> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndAssetTagIgnoreCaseAndArchivedAtIsNull(UUID organizationId, String assetTag);

    boolean existsByOrganizationIdAndAssetTagIgnoreCaseAndArchivedAtIsNullAndIdNot(
            UUID organizationId,
            String assetTag,
            UUID id
    );

    long countByOrganizationIdAndStatusAndArchivedAtIsNull(UUID organizationId, String status);

    long countByOrganizationIdAndCategoryId(UUID organizationId, UUID categoryId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Asset a where a.id = :id and a.organizationId = :organizationId")
    Optional<Asset> lockByIdAndOrganizationId(@Param("id") UUID id, @Param("organizationId") UUID organizationId);
}
