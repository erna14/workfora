package com.workfora.performance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class PerformanceDtos {
    private PerformanceDtos() {}
    public record CycleRequest(@NotBlank String name, @NotNull LocalDate startDate, @NotNull LocalDate endDate, String status) {}
    public record CycleResponse(UUID id, String name, LocalDate startDate, LocalDate endDate, String status) {}
    public record GoalRequest(@NotNull UUID cycleId, @NotNull UUID employeeId, @NotBlank String title, String description, BigDecimal targetValue, BigDecimal weight) {}
    public record GoalUpdateRequest(BigDecimal currentValue, String status, String description) {}
    public record GoalResponse(UUID id, UUID cycleId, UUID employeeId, String title, String description, BigDecimal targetValue, BigDecimal currentValue, BigDecimal weight, String status) {}
    public record ReviewRequest(@NotNull UUID cycleId, @NotNull UUID employeeId, UUID reviewerId, BigDecimal rating, String comments, String status) {}
    public record ReviewResponse(UUID id, UUID cycleId, UUID employeeId, UUID reviewerId, BigDecimal rating, String comments, String status, Instant submittedAt) {}
}
