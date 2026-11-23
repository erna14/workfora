package com.workfora.organization.dto;

import java.util.UUID;

public record LocationResponse(
        UUID id,
        UUID organizationId,
        String name,
        String addressLine1,
        String city,
        String country,
        String timezone
) {}
