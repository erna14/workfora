package com.workfora.asset.repository;

import com.workfora.asset.domain.AssetCategory;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetCategoryRepository extends JpaRepository<AssetCategory, UUID> {
    Page<AssetCategory> findByOrganizationId(UUID organizationId, Pageable pageable);

    Optional<AssetCategory> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndName(UUID organizationId, String name);

    boolean existsByOrganizationIdAndNameAndIdNot(UUID organizationId, String name, UUID id);
}
