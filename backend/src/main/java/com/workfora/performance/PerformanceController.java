package com.workfora.performance;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.performance.dto.PerformanceDtos.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/performance")
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    @GetMapping("/cycles")
    @PreAuthorize("hasAuthority('performance:read')")
    public PageResponse<CycleResponse> cycles(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(performanceService.listCycles(pageable));
    }

    @PostMapping("/cycles")
    @PreAuthorize("hasAuthority('performance:write')")
    public ApiResponse<CycleResponse> createCycle(@Valid @RequestBody CycleRequest request) {
        return ApiResponse.of(performanceService.createCycle(request));
    }

    @GetMapping("/goals")
    @PreAuthorize("hasAuthority('performance:read')")
    public PageResponse<GoalResponse> goals(
            @RequestParam(required = false) UUID cycleId,
            @RequestParam(required = false) UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(performanceService.listGoals(cycleId, employeeId, pageable));
    }

    @PostMapping("/goals")
    @PreAuthorize("hasAuthority('performance:write')")
    public ApiResponse<GoalResponse> createGoal(@Valid @RequestBody GoalRequest request) {
        return ApiResponse.of(performanceService.createGoal(request));
    }

    @PatchMapping("/goals/{id}")
    @PreAuthorize("hasAuthority('performance:write')")
    public ApiResponse<GoalResponse> updateGoal(@PathVariable UUID id, @RequestBody GoalUpdateRequest request) {
        return ApiResponse.of(performanceService.updateGoal(id, request));
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasAuthority('performance:read')")
    public PageResponse<ReviewResponse> reviews(
            @RequestParam(required = false) UUID cycleId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(performanceService.listReviews(cycleId, pageable));
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasAuthority('performance:write')")
    public ApiResponse<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
        return ApiResponse.of(performanceService.createOrUpdateReview(request));
    }
}
