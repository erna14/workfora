package com.workfora.asset.repository;

import com.workfora.asset.domain.AssetEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetEventRepository extends JpaRepository<AssetEvent, UUID> {
    List<AssetEvent> findByAssetIdAndOrganizationIdOrderByOccurredAtAsc(UUID assetId, UUID organizationId);
}
