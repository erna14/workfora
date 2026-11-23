package com.workfora.recruitment.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interviews")
public class Interview extends BaseEntity {
    @Column(name = "applicant_id", nullable = false) private UUID applicantId;
    @Column(name = "interviewer_id") private UUID interviewerId;
    @Column(name = "scheduled_at", nullable = false) private Instant scheduledAt;
    @Column(name = "interview_type", nullable = false, length = 50) private String interviewType = "VIDEO";
    @Column(nullable = false, length = 30) private String status = "SCHEDULED";
    @Column(length = 2000) private String feedback;
    @Column(precision = 5, scale = 2) private BigDecimal score;
    public UUID getApplicantId() { return applicantId; }
    public void setApplicantId(UUID applicantId) { this.applicantId = applicantId; }
    public UUID getInterviewerId() { return interviewerId; }
    public void setInterviewerId(UUID interviewerId) { this.interviewerId = interviewerId; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public String getInterviewType() { return interviewType; }
    public void setInterviewType(String interviewType) { this.interviewType = interviewType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
}
