package com.workfora.organization.dto;

import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        UUID organizationId,
        UUID parentId,
        String code,
        String name,
        String description
) {}
