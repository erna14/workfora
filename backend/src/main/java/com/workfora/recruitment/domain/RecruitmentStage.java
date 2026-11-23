package com.workfora.recruitment.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "recruitment_stages")
public class RecruitmentStage extends BaseEntity {
    @Column(name = "job_opening_id", nullable = false) private UUID jobOpeningId;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    public UUID getJobOpeningId() { return jobOpeningId; }
    public void setJobOpeningId(UUID jobOpeningId) { this.jobOpeningId = jobOpeningId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
