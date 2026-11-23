package com.workfora.report.dto;

public record ReportSummaryResponse(
        long totalEmployees,
        long activeEmployees,
        long pendingLeaveRequests,
        long openJobs,
        long availableAssets
) {}
