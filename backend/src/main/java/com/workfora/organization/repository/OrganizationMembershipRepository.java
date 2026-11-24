package com.workfora.organization.repository;

import com.workfora.organization.domain.MembershipStatus;
import com.workfora.organization.domain.OrganizationMembership;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, UUID> {

    Optional<OrganizationMembership> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    Optional<OrganizationMembership> findFirstByUserIdAndStatusAndPrimaryTrue(UUID userId, MembershipStatus status);

    List<OrganizationMembership> findByUserIdAndStatus(UUID userId, MembershipStatus status);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
