package com.workfora.onboarding.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "onboarding_template_tasks")
public class OnboardingTemplateTask extends BaseEntity {
    @Column(name = "template_id", nullable = false) private UUID templateId;
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 1000) private String description;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(name = "due_days_offset", nullable = false) private int dueDaysOffset = 7;
    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public int getDueDaysOffset() { return dueDaysOffset; }
    public void setDueDaysOffset(int dueDaysOffset) { this.dueDaysOffset = dueDaysOffset; }
}
