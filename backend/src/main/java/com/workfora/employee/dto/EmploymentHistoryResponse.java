package com.workfora.employee.dto;

import java.time.LocalDate;
import java.util.UUID;

public record EmploymentHistoryResponse(
        UUID id, String title, String departmentName, LocalDate startedOn, LocalDate endedOn, String notes
) {}
