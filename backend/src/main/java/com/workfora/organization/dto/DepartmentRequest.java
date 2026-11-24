package com.workfora.organization.dto;

import com.workfora.organization.domain.OrgUnitStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record DepartmentRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        UUID parentId,
        UUID managerEmployeeId,
        OrgUnitStatus status
) {}
