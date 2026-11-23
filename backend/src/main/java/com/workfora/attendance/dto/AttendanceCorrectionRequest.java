package com.workfora.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record AttendanceCorrectionRequest(
        Instant checkInAt,
        Instant checkOutAt,
        String status,
        String notes,
        @NotBlank String reason
) {}
