package com.workfora.onboarding;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.onboarding.dto.OnboardingDtos.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAuthority('onboarding:read')")
    public PageResponse<TemplateResponse> templates(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(onboardingService.listTemplates(pageable));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAuthority('onboarding:write')")
    public ApiResponse<TemplateResponse> createTemplate(@Valid @RequestBody TemplateRequest request) {
        return ApiResponse.of(onboardingService.createTemplate(request));
    }

    @PostMapping("/templates/{id}/tasks")
    @PreAuthorize("hasAuthority('onboarding:write')")
    public ApiResponse<TemplateTaskResponse> addTask(@PathVariable UUID id, @Valid @RequestBody TemplateTaskRequest request) {
        return ApiResponse.of(onboardingService.addTemplateTask(id, request));
    }

    @GetMapping("/checklists")
    @PreAuthorize("hasAuthority('onboarding:read')")
    public PageResponse<ChecklistResponse> checklists(
            @RequestParam(required = false) UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(onboardingService.listChecklists(employeeId, pageable));
    }

    @PostMapping("/checklists")
    @PreAuthorize("hasAuthority('onboarding:write')")
    public ApiResponse<ChecklistResponse> start(@Valid @RequestBody StartChecklistRequest request) {
        return ApiResponse.of(onboardingService.startChecklist(request));
    }

    @PostMapping("/tasks/{id}/complete")
    @PreAuthorize("hasAuthority('onboarding:write')")
    public ApiResponse<TaskResponse> complete(@PathVariable UUID id) {
        return ApiResponse.of(onboardingService.completeTask(id));
    }
}
