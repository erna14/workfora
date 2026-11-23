package com.workfora.attendance.dto;

import java.time.Instant;

public record AttendanceTodayResponse(
        String sessionState,
        Instant serverTime,
        AttendanceResponse record,
        BreakResponse activeBreak,
        long elapsedGrossSeconds,
        long elapsedBreakSeconds,
        long elapsedNetSeconds
) {}
