package com.workfora.recruitment;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.recruitment.dto.RecruitmentDtos.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recruitment")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    public RecruitmentController(RecruitmentService recruitmentService) {
        this.recruitmentService = recruitmentService;
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAuthority('recruitment:read')")
    public PageResponse<JobOpeningResponse> listJobs(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(recruitmentService.listJobs(pageable));
    }

    @GetMapping("/jobs/{id}")
    @PreAuthorize("hasAuthority('recruitment:read')")
    public ApiResponse<JobOpeningResponse> getJob(@PathVariable UUID id) {
        return ApiResponse.of(recruitmentService.getJob(id));
    }

    @PostMapping("/jobs")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<JobOpeningResponse> createJob(@Valid @RequestBody JobOpeningRequest request) {
        return ApiResponse.of(recruitmentService.createJob(request));
    }

    @PutMapping("/jobs/{id}")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<JobOpeningResponse> updateJob(@PathVariable UUID id, @Valid @RequestBody JobOpeningRequest request) {
        return ApiResponse.of(recruitmentService.updateJob(id, request));
    }

    @PostMapping("/jobs/{id}/stages")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<StageResponse> addStage(@PathVariable UUID id, @Valid @RequestBody StageRequest request) {
        return ApiResponse.of(recruitmentService.addStage(id, request));
    }

    @GetMapping("/applicants")
    @PreAuthorize("hasAuthority('recruitment:read')")
    public PageResponse<ApplicantResponse> listApplicants(
            @RequestParam(required = false) UUID jobOpeningId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(recruitmentService.listApplicants(jobOpeningId, pageable));
    }

    @PostMapping("/applicants")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<ApplicantResponse> createApplicant(@Valid @RequestBody ApplicantRequest request) {
        return ApiResponse.of(recruitmentService.createApplicant(request));
    }

    @GetMapping("/interviews")
    @PreAuthorize("hasAuthority('recruitment:read')")
    public PageResponse<InterviewResponse> listInterviews(
            @RequestParam(required = false) UUID applicantId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(recruitmentService.listInterviews(applicantId, pageable));
    }

    @PostMapping("/interviews")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<InterviewResponse> schedule(@Valid @RequestBody InterviewRequest request) {
        return ApiResponse.of(recruitmentService.scheduleInterview(request));
    }

    @PatchMapping("/interviews/{id}")
    @PreAuthorize("hasAuthority('recruitment:write')")
    public ApiResponse<InterviewResponse> updateInterview(@PathVariable UUID id, @RequestBody InterviewFeedbackRequest request) {
        return ApiResponse.of(recruitmentService.updateInterview(id, request));
    }
}
