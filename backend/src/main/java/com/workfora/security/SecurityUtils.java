package com.workfora.security;

import com.workfora.common.exception.BusinessException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<UserPrincipal> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal);
    }

    public static UUID requireUserId() {
        return currentUser().map(UserPrincipal::getId)
                .orElseThrow(() -> new IllegalStateException("Unauthenticated"));
    }

    /**
     * Tenant context is derived from the authenticated principal's membership/home organization.
     * Never trust a client-supplied organization ID for authorization.
     */
    public static UUID requireOrganizationId() {
        return currentUser()
                .map(UserPrincipal::getOrganizationId)
                .filter(id -> id != null)
                .orElseThrow(() -> new BusinessException(
                        "No organization context for the current user",
                        HttpStatus.FORBIDDEN
                ));
    }
}
