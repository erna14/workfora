package com.workfora.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PositionRequest(
        @NotNull UUID departmentId,
        @NotBlank String title,
        String level,
        String description
) {}
