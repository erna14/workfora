package com.workfora.employee.dto;

import com.workfora.employee.domain.EmployeeStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeCreateRequest(
        @NotBlank String employeeNumber,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String workEmail,
        String personalEmail,
        String phone,
        EmployeeStatus status,
        LocalDate hireDate,
        LocalDate dateOfBirth,
        UUID departmentId,
        UUID positionId,
        UUID teamId,
        UUID managerId,
        UUID locationId,
        String jobTitle
) {}
