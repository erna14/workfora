package com.workfora.organization;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.organization.domain.OrgUnitStatus;
import com.workfora.organization.dto.OrgUnitStatusRequest;
import com.workfora.organization.dto.PositionRequest;
import com.workfora.organization.dto.PositionResponse;
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
@RequestMapping("/api/v1/positions")
public class PositionController {

    private final PositionService service;

    public PositionController(PositionService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('position:read')")
    public PageResponse<PositionResponse> list(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrgUnitStatus status,
            @PageableDefault(size = 20, sort = "title") Pageable pageable
    ) {
        return PageResponse.from(service.list(organizationId, departmentId, search, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('position:read')")
    public ApiResponse<PositionResponse> get(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId
    ) {
        return ApiResponse.of(service.get(organizationId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('position:create')")
    public ApiResponse<PositionResponse> create(
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody PositionRequest request
    ) {
        return ApiResponse.of(service.create(organizationId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('position:update')")
    public ApiResponse<PositionResponse> update(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody PositionRequest request
    ) {
        return ApiResponse.of(service.update(organizationId, id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('position:update')")
    public ApiResponse<PositionResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @Valid @RequestBody OrgUnitStatusRequest request
    ) {
        return ApiResponse.of(service.updateStatus(organizationId, id, request.status()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('position:delete')")
    public ApiResponse<Void> delete(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId
    ) {
        service.delete(organizationId, id);
        return ApiResponse.of(null);
    }
}
