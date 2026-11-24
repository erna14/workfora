package com.workfora.organization;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.organization.domain.OrgUnitStatus;
import com.workfora.organization.dto.DepartmentRequest;
import com.workfora.organization.dto.DepartmentResponse;
import com.workfora.organization.dto.OrgUnitStatusRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('department:read')")
    public PageResponse<DepartmentResponse> list(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrgUnitStatus status,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        return PageResponse.from(service.list(organizationId, search, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('department:read')")
    public ApiResponse<DepartmentResponse> get(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId
    ) {
        return ApiResponse.of(service.get(organizationId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('department:create')")
    public ApiResponse<DepartmentResponse> create(
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return ApiResponse.of(service.create(organizationId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('department:update')")
    public ApiResponse<DepartmentResponse> update(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return ApiResponse.of(service.update(organizationId, id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('department:update')")
    public ApiResponse<DepartmentResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody OrgUnitStatusRequest request
    ) {
        return ApiResponse.of(service.updateStatus(organizationId, id, request.status()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('department:delete')")
    public ApiResponse<Void> delete(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId
    ) {
        service.delete(organizationId, id);
        return ApiResponse.of(null);
    }
}
