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

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<CategoryResponse> updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.of(assetService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<CategoryResponse> deleteCategory(@PathVariable UUID id) {
        return ApiResponse.of(assetService.deleteCategory(id));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('asset:read')")
    public PageResponse<HistoryFeedItem> historyFeed(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(assetService.historyFeed(assetId, type, search, pageable));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('asset:read')")
    public PageResponse<AssetResponse> list(
            @RequestParam(defaultValue = "false") boolean archived,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(assetService.listAssets(archived, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssetResponse> create(@Valid @RequestBody AssetRequest request) {
        return ApiResponse.of(assetService.createAsset(request));
    }

    @PatchMapping("/bulk")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<BulkResult> bulkUpdateCategory(@Valid @RequestBody BulkCategoryRequest request) {
        return ApiResponse.of(assetService.bulkUpdateCategory(request));
    }

    @PostMapping("/bulk/assign")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<BulkResult> bulkAssign(@Valid @RequestBody BulkAssignRequest request) {
        return ApiResponse.of(assetService.bulkAssign(request));
    }

    @PostMapping("/bulk/archive")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<BulkResult> bulkArchive(@Valid @RequestBody BulkIdsRequest request) {
        return ApiResponse.of(assetService.bulkArchive(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssetResponse> update(@PathVariable UUID id, @Valid @RequestBody AssetRequest request) {
        return ApiResponse.of(assetService.updateAsset(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('asset:write')")
    public ApiResponse<AssetResponse> archive(@PathVariable UUID id) {
        return ApiResponse.of(assetService.archive(id));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAuthority('asset:read')")
    public ApiResponse<AssetHistoryResponse> history(@PathVariable UUID id) {
        return ApiResponse.of(assetService.history(id));
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
