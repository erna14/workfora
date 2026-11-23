package com.workfora.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class PayrollDtos {
    private PayrollDtos() {}

    public record StructureRequest(@NotBlank String name, String currency, String description) {}
    public record ComponentRequest(@NotBlank String name, @NotBlank String componentType, BigDecimal amount, BigDecimal percentage, int sortOrder) {}
    public record StructureResponse(UUID id, String name, String currency, String description, boolean active, List<ComponentResponse> components) {}
    public record ComponentResponse(UUID id, String name, String componentType, BigDecimal amount, BigDecimal percentage, int sortOrder) {}
    public record EmployeeSalaryRequest(@NotNull UUID employeeId, @NotNull UUID structureId, @NotNull BigDecimal basicSalary, @NotNull LocalDate effectiveFrom) {}
    public record EmployeeSalaryResponse(UUID id, UUID employeeId, UUID structureId, BigDecimal basicSalary, LocalDate effectiveFrom, LocalDate effectiveTo) {}
    public record PeriodRequest(@NotBlank String name, @NotNull LocalDate startDate, @NotNull LocalDate endDate) {}
    public record PeriodResponse(UUID id, String name, LocalDate startDate, LocalDate endDate, String status, Instant processedAt) {}
    public record PayslipLineResponse(UUID id, String componentName, String componentType, BigDecimal amount) {}
    public record PayslipResponse(UUID id, UUID periodId, UUID employeeId, BigDecimal grossPay, BigDecimal totalDeductions, BigDecimal netPay, String status, List<PayslipLineResponse> lines) {}
}
