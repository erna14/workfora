package com.workfora.leave;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.leave.dto.LeaveDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/leave")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping("/types")
    @PreAuthorize("hasAuthority('leave:read')")
    public ApiResponse<List<LeaveTypeResponse>> types() {
        return ApiResponse.of(leaveService.listTypes());
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAuthority('leave:read')")
    public ApiResponse<List<LeaveBalanceResponse>> balances(
            @RequestParam UUID employeeId,
            @RequestParam(required = false) Integer year
    ) {
        return ApiResponse.of(leaveService.balances(employeeId, year));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAuthority('leave:read')")
    public PageResponse<LeaveRequestResponse> requests(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(leaveService.listRequests(employeeId, status, pageable));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAuthority('leave:write')")
    public ApiResponse<LeaveRequestResponse> create(@Valid @RequestBody LeaveRequestCreate request) {
        return ApiResponse.of(leaveService.createRequest(request));
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasAuthority('leave:approve')")
    public ApiResponse<LeaveRequestResponse> approve(@PathVariable UUID id, @RequestBody(required = false) LeaveReviewRequest review) {
        return ApiResponse.of(leaveService.approve(id, review));
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAuthority('leave:approve')")
    public ApiResponse<LeaveRequestResponse> reject(@PathVariable UUID id, @RequestBody(required = false) LeaveReviewRequest review) {
        return ApiResponse.of(leaveService.reject(id, review));
    }

    @GetMapping("/holidays")
    @PreAuthorize("hasAuthority('leave:read')")
    public PageResponse<HolidayResponse> holidays(@PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(leaveService.listHolidays(pageable));
    }

    @PostMapping("/holidays")
    @PreAuthorize("hasAuthority('leave:approve')")
    public ApiResponse<HolidayResponse> createHoliday(@Valid @RequestBody HolidayRequest request) {
        return ApiResponse.of(leaveService.createHoliday(request));
    }
}
