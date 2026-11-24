package com.workfora.auth.dto;

public record VerifyEmailResponse(
        boolean verified,
        String email,
        String message
) {
}
