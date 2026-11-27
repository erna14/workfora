package com.workfora.asset.dto;

import java.time.Instant;
import java.util.UUID;

public record OpenAssignment(
        UUID assetId,
        UUID employeeId,
        String firstName,
        String lastName,
        String employeeNumber,
        Instant assignedAt
) {
}
