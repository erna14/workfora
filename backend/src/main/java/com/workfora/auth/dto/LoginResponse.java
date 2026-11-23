package com.workfora.auth.dto;

public record LoginResponse(
        String accessToken,
        long expiresIn,
        UserMeResponse user
) {
}
