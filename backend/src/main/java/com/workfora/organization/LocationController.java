package com.workfora.organization;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.organization.dto.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    private final LocationService service;

    public LocationController(LocationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('employee:read')")
    public PageResponse<?> list(@org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return PageResponse.from(service.list(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('employee:read')")
    public ApiResponse<?> get(@PathVariable UUID id) {
        return ApiResponse.of(service.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('org:configure')")
    public ApiResponse<?> create(@Valid @RequestBody LocationRequest request) {
        return ApiResponse.of(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('org:configure')")
    public ApiResponse<?> update(@PathVariable UUID id, @Valid @RequestBody LocationRequest request) {
        return ApiResponse.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('org:configure')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.of(null);
    }
}
