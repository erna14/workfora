package com.workfora.attendance;

import com.workfora.attendance.dto.AttendanceCorrectionRequest;
import com.workfora.attendance.dto.AttendanceCorrectionResponse;
import com.workfora.attendance.dto.AttendanceOverviewResponse;
import com.workfora.attendance.dto.AttendanceResponse;
import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/attendance")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    public AdminAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('attendance:read')")
    public PageResponse<AttendanceResponse> list(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) Boolean missingCheckout,
            @RequestParam(required = false) Boolean lateOnly,
            @PageableDefault(size = 20, sort = "workDate") Pageable pageable
    ) {
        return PageResponse.from(attendanceService.list(
                employeeId, departmentId, from, to, missingCheckout, lateOnly, pageable));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<AttendanceOverviewResponse> overview(@RequestParam(required = false) LocalDate date) {
        return ApiResponse.of(attendanceService.overview(date));
    }

    @PutMapping("/{id}/correct")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> correct(
            @PathVariable UUID id,
            @Valid @RequestBody AttendanceCorrectionRequest request
    ) {
        return ApiResponse.of(attendanceService.correct(id, request));
    }

    @GetMapping("/{id}/corrections")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<List<AttendanceCorrectionResponse>> corrections(@PathVariable UUID id) {
        return ApiResponse.of(attendanceService.corrections(id));
    }
}
