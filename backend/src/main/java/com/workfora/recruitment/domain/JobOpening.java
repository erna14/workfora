package com.workfora.recruitment.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "job_openings")
public class JobOpening extends BaseEntity {
    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(name = "department_id") private UUID departmentId;
    @Column(name = "location_id") private UUID locationId;
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 4000) private String description;
    @Column(nullable = false, length = 30) private String status = "DRAFT";
    @Column(nullable = false) private int openings = 1;
    @Column(name = "published_at") private Instant publishedAt;
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public UUID getLocationId() { return locationId; }
    public void setLocationId(UUID locationId) { this.locationId = locationId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getOpenings() { return openings; }
    public void setOpenings(int openings) { this.openings = openings; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
