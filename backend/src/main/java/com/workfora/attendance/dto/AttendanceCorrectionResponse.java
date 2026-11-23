package com.workfora.attendance.dto;

import java.time.Instant;
import java.util.UUID;

public record AttendanceCorrectionResponse(
        UUID id,
        UUID attendanceRecordId,
        UUID correctedByUserId,
        String fieldName,
        String oldValue,
        String newValue,
        String reason,
        Instant createdAt
) {}
