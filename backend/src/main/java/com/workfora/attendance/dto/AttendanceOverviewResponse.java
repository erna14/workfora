package com.workfora.attendance.dto;

import java.time.LocalDate;

public record AttendanceOverviewResponse(
        LocalDate date,
        long presentCount,
        long workingCount,
        long onBreakCount,
        long completedCount,
        long missingCheckoutCount,
        long lateCount
) {}
