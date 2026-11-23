package com.workfora.dashboard;

import com.workfora.common.response.ApiResponse;
import com.workfora.dashboard.dto.DashboardSummaryResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('dashboard:read')")
    public ApiResponse<DashboardSummaryResponse> summary() {
        return ApiResponse.of(dashboardService.summary());
    }
}
