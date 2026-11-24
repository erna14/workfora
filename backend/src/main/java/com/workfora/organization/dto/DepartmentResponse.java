package com.workfora.organization.dto;

import com.workfora.organization.domain.OrgUnitStatus;
import java.time.Instant;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        UUID organizationId,
        UUID parentId,
        String code,
        String name,
        String description,
        UUID managerEmployeeId,
        String managerName,
        OrgUnitStatus status,
        long employeeCount,
        long positionCount,
        Instant createdAt,
        Instant updatedAt
) {}
