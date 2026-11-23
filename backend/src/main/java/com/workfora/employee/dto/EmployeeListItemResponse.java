package com.workfora.employee.dto;

import com.workfora.employee.domain.EmployeeStatus;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeListItemResponse(
        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String workEmail,
        EmployeeStatus status,
        String jobTitle,
        UUID departmentId,
        UUID managerId,
        LocalDate hireDate
) {}
