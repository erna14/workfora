package com.workfora.organization.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record DepartmentRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        UUID parentId
) {}
