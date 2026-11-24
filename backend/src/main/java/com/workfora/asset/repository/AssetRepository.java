package com.workfora.asset.repository;

import com.workfora.asset.domain.Asset;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Page<Asset> findByOrganizationId(UUID organizationId, Pageable pageable);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
}
