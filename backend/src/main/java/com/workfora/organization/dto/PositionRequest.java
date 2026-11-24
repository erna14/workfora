package com.workfora.organization.dto;

import com.workfora.organization.domain.OrgUnitStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record PositionRequest(
        @NotNull UUID departmentId,
        @NotBlank @Size(max = 150) String title,
        @Size(max = 50) String level,
        @Size(max = 500) String description,
        OrgUnitStatus status
) {}
