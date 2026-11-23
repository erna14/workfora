package com.workfora.performance.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "performance_reviews")
public class PerformanceReview extends BaseEntity {
    @Column(name = "cycle_id", nullable = false) private UUID cycleId;
    @Column(name = "employee_id", nullable = false) private UUID employeeId;
    @Column(name = "reviewer_id") private UUID reviewerId;
    @Column(precision = 4, scale = 2) private BigDecimal rating;
    @Column(length = 4000) private String comments;
    @Column(nullable = false, length = 30) private String status = "DRAFT";
    @Column(name = "submitted_at") private Instant submittedAt;
    public UUID getCycleId() { return cycleId; }
    public void setCycleId(UUID cycleId) { this.cycleId = cycleId; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public UUID getReviewerId() { return reviewerId; }
    public void setReviewerId(UUID reviewerId) { this.reviewerId = reviewerId; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
