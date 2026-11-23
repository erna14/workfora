package com.workfora.asset;

import com.workfora.asset.dto.AssetDtos.*;
import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAuthority('asset:read')")
    public PageResponse<CategoryResponse> categories(@PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.from(assetService.listCategories(pageable));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.of(assetService.createCategory(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('asset:read')")
    public PageResponse<AssetResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(assetService.listAssets(pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssetResponse> create(@Valid @RequestBody AssetRequest request) {
        return ApiResponse.of(assetService.createAsset(request));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssignmentResponse> assign(@PathVariable UUID id, @Valid @RequestBody AssignRequest request) {
        return ApiResponse.of(assetService.assign(id, request));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssignmentResponse> returnAsset(@PathVariable UUID id) {
        return ApiResponse.of(assetService.returnAsset(id));
    }
}
