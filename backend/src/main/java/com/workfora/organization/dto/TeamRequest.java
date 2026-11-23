package com.workfora.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TeamRequest(
        @NotNull UUID departmentId,
        @NotBlank String name,
        String description
) {}
