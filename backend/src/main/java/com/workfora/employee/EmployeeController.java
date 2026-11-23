package com.workfora.employee;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.dto.EmployeeCreateRequest;
import com.workfora.employee.dto.EmployeeDetailResponse;
import com.workfora.employee.dto.EmployeeListItemResponse;
import com.workfora.employee.dto.EmployeeUpdateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('employee:read')")
    public PageResponse<EmployeeListItemResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) UUID departmentId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(employeeService.list(search, status, departmentId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('employee:read')")
    public ApiResponse<EmployeeDetailResponse> get(@PathVariable UUID id) {
        return ApiResponse.of(employeeService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('employee:write')")
    public ApiResponse<EmployeeDetailResponse> create(@Valid @RequestBody EmployeeCreateRequest request) {
        return ApiResponse.of(employeeService.create(request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('employee:write')")
    public ApiResponse<EmployeeDetailResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeUpdateRequest request
    ) {
        return ApiResponse.of(employeeService.update(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('employee:write')")
    public ApiResponse<EmployeeDetailResponse> deactivate(@PathVariable UUID id) {
        return ApiResponse.of(employeeService.deactivate(id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('employee:write')")
    public ApiResponse<EmployeeDetailResponse> activate(@PathVariable UUID id) {
        return ApiResponse.of(employeeService.activate(id));
    }
}
