package com.workfora.payroll;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.payroll.dto.PayrollDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping("/structures")
    @PreAuthorize("hasAuthority('payroll:read')")
    public PageResponse<StructureResponse> structures(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(payrollService.listStructures(pageable));
    }

    @PostMapping("/structures")
    @PreAuthorize("hasAuthority('payroll:write')")
    public ApiResponse<StructureResponse> createStructure(@Valid @RequestBody StructureRequest request) {
        return ApiResponse.of(payrollService.createStructure(request));
    }

    @PostMapping("/structures/{id}/components")
    @PreAuthorize("hasAuthority('payroll:write')")
    public ApiResponse<ComponentResponse> addComponent(@PathVariable UUID id, @Valid @RequestBody ComponentRequest request) {
        return ApiResponse.of(payrollService.addComponent(id, request));
    }

    @PostMapping("/employee-salaries")
    @PreAuthorize("hasAuthority('payroll:write')")
    public ApiResponse<EmployeeSalaryResponse> assign(@Valid @RequestBody EmployeeSalaryRequest request) {
        return ApiResponse.of(payrollService.assignSalary(request));
    }

    @GetMapping("/periods")
    @PreAuthorize("hasAuthority('payroll:read')")
    public PageResponse<PeriodResponse> periods(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(payrollService.listPeriods(pageable));
    }

    @PostMapping("/periods")
    @PreAuthorize("hasAuthority('payroll:write')")
    public ApiResponse<PeriodResponse> createPeriod(@Valid @RequestBody PeriodRequest request) {
        return ApiResponse.of(payrollService.createPeriod(request));
    }

    @PostMapping("/periods/{id}/process")
    @PreAuthorize("hasAuthority('payroll:write')")
    public ApiResponse<List<PayslipResponse>> process(@PathVariable UUID id) {
        return ApiResponse.of(payrollService.process(id));
    }

    @GetMapping("/payslips")
    @PreAuthorize("hasAuthority('payroll:read')")
    public PageResponse<PayslipResponse> payslips(@RequestParam UUID periodId, @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(payrollService.listPayslips(periodId, pageable));
    }

    @GetMapping("/payslips/{id}")
    @PreAuthorize("hasAuthority('payroll:read')")
    public ApiResponse<PayslipResponse> getPayslip(@PathVariable UUID id) {
        return ApiResponse.of(payrollService.getPayslip(id));
    }
}
