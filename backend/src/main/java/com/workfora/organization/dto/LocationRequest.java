package com.workfora.organization.dto;

import jakarta.validation.constraints.NotBlank;

public record LocationRequest(
        @NotBlank String name,
        String addressLine1,
        String city,
        String country,
        String timezone
) {}
