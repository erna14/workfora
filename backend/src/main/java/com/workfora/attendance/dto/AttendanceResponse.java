package com.workfora.attendance.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AttendanceResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        LocalDate workDate,
        Instant checkInAt,
        Instant checkOutAt,
        String status,
        String sessionState,
        long totalBreakSeconds,
        Long grossWorkSeconds,
        Long netWorkSeconds,
        int lateMinutes,
        int overtimeMinutes,
        int earlyDepartureMinutes,
        boolean late,
        boolean overtime,
        boolean earlyDeparture,
        boolean missingCheckout,
        String timezone,
        String notes,
        List<BreakResponse> breaks
) {}
