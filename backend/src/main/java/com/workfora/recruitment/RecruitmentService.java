package com.workfora.recruitment;

import com.workfora.common.OrgConstants;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.recruitment.domain.Applicant;
import com.workfora.recruitment.domain.Interview;
import com.workfora.recruitment.domain.JobOpening;
import com.workfora.recruitment.domain.RecruitmentStage;
import com.workfora.recruitment.dto.RecruitmentDtos.*;
import com.workfora.recruitment.repository.ApplicantRepository;
import com.workfora.recruitment.repository.InterviewRepository;
import com.workfora.recruitment.repository.JobOpeningRepository;
import com.workfora.recruitment.repository.RecruitmentStageRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecruitmentService {

    private final JobOpeningRepository jobOpeningRepository;
    private final RecruitmentStageRepository stageRepository;
    private final ApplicantRepository applicantRepository;
    private final InterviewRepository interviewRepository;

    public RecruitmentService(
            JobOpeningRepository jobOpeningRepository,
            RecruitmentStageRepository stageRepository,
            ApplicantRepository applicantRepository,
            InterviewRepository interviewRepository
    ) {
        this.jobOpeningRepository = jobOpeningRepository;
        this.stageRepository = stageRepository;
        this.applicantRepository = applicantRepository;
        this.interviewRepository = interviewRepository;
    }

    @Transactional(readOnly = true)
    public Page<JobOpeningResponse> listJobs(Pageable pageable) {
        return jobOpeningRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable).map(this::toJob);
    }

    @Transactional(readOnly = true)
    public JobOpeningResponse getJob(UUID id) {
        return toJob(findJob(id));
    }

    @Transactional
    public JobOpeningResponse createJob(JobOpeningRequest request) {
        JobOpening job = new JobOpening();
        job.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        apply(job, request);
        JobOpening saved = jobOpeningRepository.save(job);
        createDefaultStages(saved.getId());
        return toJob(saved);
    }

    @Transactional
    public JobOpeningResponse updateJob(UUID id, JobOpeningRequest request) {
        JobOpening job = findJob(id);
        apply(job, request);
        return toJob(jobOpeningRepository.save(job));
    }

    @Transactional
    public StageResponse addStage(UUID jobId, StageRequest request) {
        findJob(jobId);
        RecruitmentStage stage = new RecruitmentStage();
        stage.setJobOpeningId(jobId);
        stage.setName(request.name());
        stage.setSortOrder(request.sortOrder());
        RecruitmentStage saved = stageRepository.save(stage);
        return new StageResponse(saved.getId(), saved.getName(), saved.getSortOrder());
    }

    @Transactional(readOnly = true)
    public Page<ApplicantResponse> listApplicants(UUID jobOpeningId, Pageable pageable) {
        Page<Applicant> page = jobOpeningId != null
                ? applicantRepository.findByJobOpeningId(jobOpeningId, pageable)
                : applicantRepository.findAll(pageable);
        return page.map(this::toApplicant);
    }

    @Transactional
    public ApplicantResponse createApplicant(ApplicantRequest request) {
        findJob(request.jobOpeningId());
        Applicant applicant = new Applicant();
        applicant.setJobOpeningId(request.jobOpeningId());
        applicant.setFirstName(request.firstName());
        applicant.setLastName(request.lastName());
        applicant.setEmail(request.email());
        applicant.setPhone(request.phone());
        applicant.setNotes(request.notes());
        applicant.setStatus("APPLIED");
        List<RecruitmentStage> stages = stageRepository.findByJobOpeningIdOrderBySortOrderAsc(request.jobOpeningId());
        if (!stages.isEmpty()) {
            applicant.setStageId(stages.getFirst().getId());
        }
        return toApplicant(applicantRepository.save(applicant));
    }

    @Transactional
    public InterviewResponse scheduleInterview(InterviewRequest request) {
        if (!applicantRepository.existsById(request.applicantId())) {
            throw new ResourceNotFoundException("Applicant not found");
        }
        Interview interview = new Interview();
        interview.setApplicantId(request.applicantId());
        interview.setInterviewerId(request.interviewerId());
        interview.setScheduledAt(request.scheduledAt());
        interview.setInterviewType(request.interviewType() != null ? request.interviewType() : "VIDEO");
        interview.setStatus("SCHEDULED");
        return toInterview(interviewRepository.save(interview));
    }

    @Transactional
    public InterviewResponse updateInterview(UUID id, InterviewFeedbackRequest request) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
        if (request.feedback() != null) interview.setFeedback(request.feedback());
        if (request.score() != null) interview.setScore(request.score());
        if (request.status() != null) interview.setStatus(request.status());
        return toInterview(interviewRepository.save(interview));
    }

    @Transactional(readOnly = true)
    public Page<InterviewResponse> listInterviews(UUID applicantId, Pageable pageable) {
        Page<Interview> page = applicantId != null
                ? interviewRepository.findByApplicantId(applicantId, pageable)
                : interviewRepository.findAll(pageable);
        return page.map(this::toInterview);
    }

    private void createDefaultStages(UUID jobId) {
        String[] names = {"Applied", "Screening", "Interview", "Offer"};
        for (int i = 0; i < names.length; i++) {
            RecruitmentStage stage = new RecruitmentStage();
            stage.setJobOpeningId(jobId);
            stage.setName(names[i]);
            stage.setSortOrder(i + 1);
            stageRepository.save(stage);
        }
    }

    private void apply(JobOpening job, JobOpeningRequest request) {
        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setDepartmentId(request.departmentId());
        job.setLocationId(request.locationId());
        job.setOpenings(request.openings() != null ? request.openings() : 1);
        String status = request.status() != null ? request.status() : job.getStatus();
        if (status == null) status = "DRAFT";
        if ("OPEN".equals(status) && job.getPublishedAt() == null) {
            job.setPublishedAt(Instant.now());
        }
        job.setStatus(status);
    }

    private JobOpening findJob(UUID id) {
        return jobOpeningRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Job opening not found"));
    }

    private JobOpeningResponse toJob(JobOpening job) {
        List<StageResponse> stages = stageRepository.findByJobOpeningIdOrderBySortOrderAsc(job.getId()).stream()
                .map(s -> new StageResponse(s.getId(), s.getName(), s.getSortOrder()))
                .toList();
        return new JobOpeningResponse(job.getId(), job.getTitle(), job.getDescription(), job.getDepartmentId(),
                job.getLocationId(), job.getStatus(), job.getOpenings(), job.getPublishedAt(), stages);
    }

    private ApplicantResponse toApplicant(Applicant a) {
        return new ApplicantResponse(a.getId(), a.getJobOpeningId(), a.getStageId(), a.getFirstName(), a.getLastName(),
                a.getEmail(), a.getPhone(), a.getStatus(), a.getNotes());
    }

    private InterviewResponse toInterview(Interview i) {
        return new InterviewResponse(i.getId(), i.getApplicantId(), i.getInterviewerId(), i.getScheduledAt(),
                i.getInterviewType(), i.getStatus(), i.getFeedback(), i.getScore());
    }
}
