package com.workfora.asset.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "assets")
public class Asset extends BaseEntity {
    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(name = "category_id") private UUID categoryId;
    @Column(name = "asset_tag", nullable = false, length = 100) private String assetTag;
    @Column(nullable = false, length = 150) private String name;
    @Column(name = "serial_number", length = 100) private String serialNumber;
    @Column(nullable = false, length = 30) private String status = "AVAILABLE";
    @Column(name = "purchase_date") private LocalDate purchaseDate;
    @Column(name = "purchase_cost", precision = 12, scale = 2) private BigDecimal purchaseCost;
    @Column(length = 1000) private String notes;
    @Column(name = "archived_at") private Instant archivedAt;
    @Column(name = "active_asset_tag", length = 100) private String activeAssetTag;
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public String getAssetTag() { return assetTag; }
    public void setAssetTag(String assetTag) { this.assetTag = assetTag; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public BigDecimal getPurchaseCost() { return purchaseCost; }
    public void setPurchaseCost(BigDecimal purchaseCost) { this.purchaseCost = purchaseCost; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getArchivedAt() { return archivedAt; }
    public void setArchivedAt(Instant archivedAt) { this.archivedAt = archivedAt; }
    public String getActiveAssetTag() { return activeAssetTag; }
    public void setActiveAssetTag(String activeAssetTag) { this.activeAssetTag = activeAssetTag; }
}
