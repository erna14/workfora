package com.workfora.asset.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "asset_categories")
public class AssetCategory extends BaseEntity {
    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(nullable = false, length = 100) private String name;
    @Column(length = 500) private String description;
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
