package com.workfora.report;

import com.workfora.common.response.ApiResponse;
import com.workfora.report.dto.ReportSummaryResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('report:read')")
    public ApiResponse<ReportSummaryResponse> summary() {
        return ApiResponse.of(reportService.summary());
    }
}
