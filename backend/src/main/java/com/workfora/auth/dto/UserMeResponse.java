package com.workfora.auth.dto;

import java.util.List;
import java.util.UUID;

public record UserMeResponse(
        UUID id,
        String email,
        UUID employeeId,
        List<String> roles,
        List<String> permissions
) {
}
