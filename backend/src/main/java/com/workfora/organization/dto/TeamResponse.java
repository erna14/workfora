package com.workfora.organization.dto;

import java.util.UUID;

public record TeamResponse(UUID id, UUID departmentId, String name, String description) {}
