package com.workfora.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class AssetDtos {
    private AssetDtos() {}
    public record CategoryRequest(@NotBlank String name, String description) {}
    public record CategoryResponse(UUID id, String name, String description) {}
    public record AssetRequest(@NotBlank String assetTag, @NotBlank String name, UUID categoryId, String serialNumber, LocalDate purchaseDate, BigDecimal purchaseCost, String notes) {}
    public record AssetResponse(UUID id, UUID categoryId, String assetTag, String name, String serialNumber, String status, LocalDate purchaseDate, BigDecimal purchaseCost, String notes) {}
    public record AssignRequest(@NotNull UUID employeeId, String notes) {}
    public record AssignmentResponse(UUID id, UUID assetId, UUID employeeId, Instant assignedAt, Instant returnedAt, String notes) {}
}
