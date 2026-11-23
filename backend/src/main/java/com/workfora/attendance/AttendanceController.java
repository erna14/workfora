package com.workfora.attendance;

import com.workfora.attendance.dto.AttendanceCorrectionRequest;
import com.workfora.attendance.dto.AttendanceCorrectionResponse;
import com.workfora.attendance.dto.AttendanceOverviewResponse;
import com.workfora.attendance.dto.AttendanceResponse;
import com.workfora.attendance.dto.AttendanceTodayResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/today")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<AttendanceTodayResponse> today() {
        return ApiResponse.of(attendanceService.today());
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('attendance:read')")
    public PageResponse<AttendanceResponse> history(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @PageableDefault(size = 20, sort = "workDate") Pageable pageable
    ) {
        return PageResponse.from(attendanceService.history(from, to, pageable));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<AttendanceOverviewResponse> overview(@RequestParam(required = false) LocalDate date) {
        return ApiResponse.of(attendanceService.overview(date));
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

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<AttendanceResponse> get(@PathVariable UUID id) {
        return ApiResponse.of(attendanceService.get(id));
    }

    @GetMapping("/{id}/corrections")
    @PreAuthorize("hasAuthority('attendance:read')")
    public ApiResponse<List<AttendanceCorrectionResponse>> corrections(@PathVariable UUID id) {
        return ApiResponse.of(attendanceService.corrections(id));
    }

    @PutMapping("/{id}/correct")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> correct(
            @PathVariable UUID id,
            @Valid @RequestBody AttendanceCorrectionRequest request
    ) {
        return ApiResponse.of(attendanceService.correct(id, request));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> checkIn() {
        return ApiResponse.of(attendanceService.checkIn());
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> checkOut() {
        return ApiResponse.of(attendanceService.checkOut());
    }

    @PostMapping("/break/start")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> startBreak() {
        return ApiResponse.of(attendanceService.startBreak());
    }

    @PostMapping("/break/end")
    @PreAuthorize("hasAuthority('attendance:write')")
    public ApiResponse<AttendanceResponse> endBreak() {
        return ApiResponse.of(attendanceService.endBreak());
    }
}
