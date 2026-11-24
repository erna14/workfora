package com.workfora.organization.dto;

import com.workfora.organization.domain.OrgUnitStatus;
import java.time.Instant;
import java.util.UUID;

public record PositionResponse(
        UUID id,
        UUID organizationId,
        UUID departmentId,
        String departmentName,
        String title,
        String level,
        String description,
        OrgUnitStatus status,
        long employeeCount,
        Instant createdAt,
        Instant updatedAt
) {}
