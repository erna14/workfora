package com.workfora.organization.dto;

import java.util.UUID;

public record PositionResponse(UUID id, UUID departmentId, String title, String level, String description) {}
