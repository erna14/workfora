package com.workfora.recruitment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class RecruitmentDtos {
    private RecruitmentDtos() {}

    public record JobOpeningRequest(@NotBlank String title, String description, UUID departmentId, UUID locationId, Integer openings, String status) {}
    public record JobOpeningResponse(UUID id, String title, String description, UUID departmentId, UUID locationId, String status, int openings, Instant publishedAt, List<StageResponse> stages) {}
    public record StageResponse(UUID id, String name, int sortOrder) {}
    public record StageRequest(@NotBlank String name, int sortOrder) {}
    public record ApplicantRequest(@NotNull UUID jobOpeningId, @NotBlank String firstName, @NotBlank String lastName, @NotBlank @Email String email, String phone, String notes) {}
    public record ApplicantResponse(UUID id, UUID jobOpeningId, UUID stageId, String firstName, String lastName, String email, String phone, String status, String notes) {}
    public record InterviewRequest(@NotNull UUID applicantId, UUID interviewerId, @NotNull Instant scheduledAt, String interviewType) {}
    public record InterviewResponse(UUID id, UUID applicantId, UUID interviewerId, Instant scheduledAt, String interviewType, String status, String feedback, BigDecimal score) {}
    public record InterviewFeedbackRequest(String feedback, BigDecimal score, String status) {}
}
