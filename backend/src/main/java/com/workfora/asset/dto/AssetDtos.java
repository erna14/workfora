package com.workfora.asset.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class AssetDtos {
    private AssetDtos() {}

    public record CategoryRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 500) String description
    ) {}

    public record CategoryResponse(UUID id, String name, String description) {}

    public record AssetRequest(
            @NotBlank(message = "Asset tag is required") @Size(max = 100, message = "Asset tag must be 100 characters or fewer") String assetTag,
            @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be 150 characters or fewer") String name,
            UUID categoryId,
            @Size(max = 100, message = "Serial number must be 100 characters or fewer") String serialNumber,
            LocalDate purchaseDate,
            @DecimalMin(value = "0.00", message = "Purchase cost cannot be negative")
            @Digits(integer = 10, fraction = 2, message = "Purchase cost must have at most 10 digits and 2 decimal places")
            BigDecimal purchaseCost,
            @Size(max = 1000, message = "Notes must be 1000 characters or fewer") String notes
    ) {}

    public record CurrentAssignmentResponse(
            UUID employeeId,
            String fullName,
            String employeeNumber,
            Instant assignedAt
    ) {}

    public record AssetResponse(
            UUID id,
            UUID categoryId,
            String assetTag,
            String name,
            String serialNumber,
            String status,
            LocalDate purchaseDate,
            BigDecimal purchaseCost,
            String notes,
            Instant archivedAt,
            CurrentAssignmentResponse currentAssignment
    ) {}

    public record AssignRequest(
            @NotNull UUID employeeId,
            @Size(max = 1000, message = "Notes must be 1000 characters or fewer") String notes
    ) {}

    public record AssignmentResponse(
            UUID id,
            UUID assetId,
            UUID employeeId,
            Instant assignedAt,
            Instant returnedAt,
            String notes
    ) {}

    public record BulkIdsRequest(
            @NotEmpty @Size(max = 50) List<@NotNull UUID> ids
    ) {}

    public record BulkCategoryRequest(
            @NotEmpty @Size(max = 50) List<@NotNull UUID> ids,
            UUID categoryId,
            boolean clearCategory
    ) {}

    public record BulkAssignRequest(
            @NotEmpty @Size(max = 50) List<@NotNull UUID> ids,
            @NotNull UUID employeeId,
            @Size(max = 1000, message = "Notes must be 1000 characters or fewer") String notes
    ) {}

    public record BulkItemResult(UUID id, boolean success, String message) {}

    public record BulkResult(int succeeded, int failed, List<BulkItemResult> items) {}

    public record HistoryEventResponse(
            String type,
            Instant occurredAt,
            UUID actorUserId,
            String actorName,
            String field,
            String previousValue,
            String newValue,
            UUID employeeId,
            String employeeName,
            String employeeNumber,
            Instant assignedAt,
            Instant returnedAt,
            String notes
    ) {}

    public record AssetHistoryResponse(
            UUID assetId,
            String assetName,
            String assetTag,
            String status,
            Instant archivedAt,
            CurrentAssignmentResponse currentAssignment,
            List<HistoryEventResponse> events
    ) {}

    public record HistoryFeedItem(
            UUID assetId,
            String assetName,
            String assetTag,
            String assetStatus,
            Instant archivedAt,
            HistoryEventResponse event
    ) {}
}
