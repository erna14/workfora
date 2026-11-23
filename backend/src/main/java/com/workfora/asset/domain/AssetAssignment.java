package com.workfora.asset.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_assignments")
public class AssetAssignment extends BaseEntity {
    @Column(name = "asset_id", nullable = false) private UUID assetId;
    @Column(name = "employee_id", nullable = false) private UUID employeeId;
    @Column(name = "assigned_at", nullable = false) private Instant assignedAt;
    @Column(name = "returned_at") private Instant returnedAt;
    @Column(length = 1000) private String notes;
    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public void setReturnedAt(Instant returnedAt) { this.returnedAt = returnedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
