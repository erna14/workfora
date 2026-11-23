package com.workfora.attendance.dto;

import java.time.Instant;
import java.util.UUID;

public record BreakResponse(
        UUID id,
        UUID attendanceRecordId,
        Instant startedAt,
        Instant endedAt,
        Long durationSeconds
) {}
