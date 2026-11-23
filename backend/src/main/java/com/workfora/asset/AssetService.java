package com.workfora.asset;

import com.workfora.asset.domain.Asset;
import com.workfora.asset.domain.AssetAssignment;
import com.workfora.asset.domain.AssetCategory;
import com.workfora.asset.dto.AssetDtos.*;
import com.workfora.asset.repository.AssetAssignmentRepository;
import com.workfora.asset.repository.AssetCategoryRepository;
import com.workfora.asset.repository.AssetRepository;
import com.workfora.common.OrgConstants;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

    private final AssetCategoryRepository categoryRepository;
    private final AssetRepository assetRepository;
    private final AssetAssignmentRepository assignmentRepository;

    public AssetService(
            AssetCategoryRepository categoryRepository,
            AssetRepository assetRepository,
            AssetAssignmentRepository assignmentRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> listCategories(Pageable pageable) {
        return categoryRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable)
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription()));
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        AssetCategory category = new AssetCategory();
        category.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        category.setName(request.name());
        category.setDescription(request.description());
        AssetCategory saved = categoryRepository.save(category);
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getDescription());
    }

    @Transactional(readOnly = true)
    public Page<AssetResponse> listAssets(Pageable pageable) {
        return assetRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable).map(this::toAsset);
    }

    @Transactional
    public AssetResponse createAsset(AssetRequest request) {
        Asset asset = new Asset();
        asset.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        asset.setAssetTag(request.assetTag());
        asset.setName(request.name());
        asset.setCategoryId(request.categoryId());
        asset.setSerialNumber(request.serialNumber());
        asset.setPurchaseDate(request.purchaseDate());
        asset.setPurchaseCost(request.purchaseCost());
        asset.setNotes(request.notes());
        asset.setStatus("AVAILABLE");
        return toAsset(assetRepository.save(asset));
    }

    @Transactional
    public AssignmentResponse assign(UUID assetId, AssignRequest request) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        if (!"AVAILABLE".equals(asset.getStatus())) {
            throw new BusinessException("Asset is not available");
        }
        AssetAssignment assignment = new AssetAssignment();
        assignment.setAssetId(assetId);
        assignment.setEmployeeId(request.employeeId());
        assignment.setAssignedAt(Instant.now());
        assignment.setNotes(request.notes());
        asset.setStatus("ASSIGNED");
        assetRepository.save(asset);
        AssetAssignment saved = assignmentRepository.save(assignment);
        return new AssignmentResponse(saved.getId(), saved.getAssetId(), saved.getEmployeeId(), saved.getAssignedAt(), saved.getReturnedAt(), saved.getNotes());
    }

    @Transactional
    public AssignmentResponse returnAsset(UUID assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        AssetAssignment assignment = assignmentRepository.findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(assetId)
                .orElseThrow(() -> new BusinessException("No active assignment found"));
        assignment.setReturnedAt(Instant.now());
        asset.setStatus("AVAILABLE");
        assetRepository.save(asset);
        AssetAssignment saved = assignmentRepository.save(assignment);
        return new AssignmentResponse(saved.getId(), saved.getAssetId(), saved.getEmployeeId(), saved.getAssignedAt(), saved.getReturnedAt(), saved.getNotes());
    }

    private AssetResponse toAsset(Asset a) {
        return new AssetResponse(a.getId(), a.getCategoryId(), a.getAssetTag(), a.getName(), a.getSerialNumber(),
                a.getStatus(), a.getPurchaseDate(), a.getPurchaseCost(), a.getNotes());
    }
}
