package com.workfora.onboarding.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "onboarding_tasks")
public class OnboardingTask extends BaseEntity {
    @Column(name = "checklist_id", nullable = false) private UUID checklistId;
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 1000) private String description;
    @Column(nullable = false, length = 30) private String status = "PENDING";
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "assignee_id") private UUID assigneeId;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    public UUID getChecklistId() { return checklistId; }
    public void setChecklistId(UUID checklistId) { this.checklistId = checklistId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
