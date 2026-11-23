package com.workfora.organization.repository;

import com.workfora.organization.domain.Location;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, UUID> {
    org.springframework.data.domain.Page<Location> findByOrganizationId(java.util.UUID organizationId, org.springframework.data.domain.Pageable pageable);
}
