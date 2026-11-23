package com.workfora.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class LeaveDtos {
    private LeaveDtos() {}

    public record LeaveTypeResponse(UUID id, String code, String name, boolean paid, Integer maxDaysPerYear, String description) {}
    public record LeaveBalanceResponse(UUID id, UUID employeeId, UUID leaveTypeId, int year, BigDecimal entitled, BigDecimal used, BigDecimal pending) {}
    public record LeaveRequestResponse(UUID id, UUID employeeId, UUID leaveTypeId, LocalDate startDate, LocalDate endDate, BigDecimal days, String status, String reason, UUID reviewedBy, Instant reviewedAt, String reviewNotes) {}
    public record LeaveRequestCreate(UUID leaveTypeId, @NotNull LocalDate startDate, @NotNull LocalDate endDate, String reason) {}
    public record LeaveReviewRequest(String reviewNotes) {}
    public record HolidayRequest(@NotBlank String name, @NotNull LocalDate holidayDate) {}
    public record HolidayResponse(UUID id, String name, LocalDate holidayDate) {}
}
