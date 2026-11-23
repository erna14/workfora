package com.workfora.employee.dto;

import com.workfora.employee.domain.EmployeeStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EmployeeDetailResponse(
        UUID id,
        UUID organizationId,
        String employeeNumber,
        String firstName,
        String lastName,
        String workEmail,
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
        String jobTitle,
        Instant deactivatedAt,
        List<EmergencyContactResponse> emergencyContacts,
        List<EmploymentHistoryResponse> employmentHistory,
        List<EmployeeDocumentResponse> documents
) {}
