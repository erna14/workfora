package com.workfora.employee.dto;

import java.time.Instant;
import java.util.UUID;

public record EmployeeDocumentResponse(
        UUID id, String fileName, String contentType, String category, Instant uploadedAt
) {}
