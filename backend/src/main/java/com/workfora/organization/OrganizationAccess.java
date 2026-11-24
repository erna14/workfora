package com.workfora.organization;

import com.workfora.common.exception.BusinessException;
import com.workfora.organization.domain.MembershipStatus;
import com.workfora.organization.repository.OrganizationMembershipRepository;
import com.workfora.security.SecurityUtils;
import com.workfora.security.UserPrincipal;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Resolves the organization a request is allowed to operate on.
 * A client-supplied id is accepted only when the caller has an active membership there.
 */
@Service
public class OrganizationAccess {

    private final OrganizationMembershipRepository membershipRepository;

    public OrganizationAccess(OrganizationMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public UUID require(UUID requestedOrganizationId) {
        UserPrincipal principal = SecurityUtils.currentUser()
                .orElseThrow(() -> new BusinessException("Unauthenticated", HttpStatus.UNAUTHORIZED));
        UUID target = requestedOrganizationId != null ? requestedOrganizationId : principal.getOrganizationId();
        if (target == null) {
            throw new BusinessException("No organization context for the current user", HttpStatus.FORBIDDEN);
        }
        boolean activeMember = membershipRepository.findByUserIdAndOrganizationId(principal.getId(), target)
                .filter(membership -> membership.getStatus() == MembershipStatus.ACTIVE)
                .isPresent();
        if (!activeMember) {
            throw new BusinessException(
                    "You are not an active member of this organization",
                    HttpStatus.FORBIDDEN
            );
        }
        return target;
    }
}
