package com.workfora.auth.dto;

import java.util.UUID;

public record RegistrationResponse(
        UUID organizationId,
        String organizationSlug,
        String organizationName,
        UUID userId,
        String email,
        boolean emailVerificationRequired,
        String message,
        String developmentVerificationToken
) {
}
