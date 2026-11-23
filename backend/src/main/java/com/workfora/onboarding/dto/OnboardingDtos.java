package com.workfora.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class OnboardingDtos {
    private OnboardingDtos() {}

    public record TemplateRequest(@NotBlank String name, String description, Boolean active) {}
    public record TemplateTaskRequest(@NotBlank String title, String description, int sortOrder, Integer dueDaysOffset) {}
    public record TemplateResponse(UUID id, String name, String description, boolean active, List<TemplateTaskResponse> tasks) {}
    public record TemplateTaskResponse(UUID id, String title, String description, int sortOrder, int dueDaysOffset) {}
    public record StartChecklistRequest(@NotNull UUID employeeId, @NotNull UUID templateId) {}
    public record ChecklistResponse(UUID id, UUID employeeId, UUID templateId, String status, Instant startedAt, Instant completedAt, List<TaskResponse> tasks) {}
    public record TaskResponse(UUID id, String title, String description, String status, LocalDate dueDate, Instant completedAt, UUID assigneeId, int sortOrder) {}
}
