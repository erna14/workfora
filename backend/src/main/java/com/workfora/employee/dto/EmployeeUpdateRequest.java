package com.workfora.employee.dto;

import java.time.LocalDate;
import java.util.UUID;

public record EmployeeUpdateRequest(
        String firstName,
        String lastName,
        String personalEmail,
        String phone,
        LocalDate hireDate,
        LocalDate dateOfBirth,
        UUID departmentId,
        UUID positionId,
        UUID teamId,
        UUID managerId,
        UUID locationId,
        String jobTitle
) {}
