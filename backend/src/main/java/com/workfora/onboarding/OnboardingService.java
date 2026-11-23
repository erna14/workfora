package com.workfora.onboarding;

import com.workfora.common.OrgConstants;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.onboarding.domain.OnboardingChecklist;
import com.workfora.onboarding.domain.OnboardingTask;
import com.workfora.onboarding.domain.OnboardingTemplate;
import com.workfora.onboarding.domain.OnboardingTemplateTask;
import com.workfora.onboarding.dto.OnboardingDtos.*;
import com.workfora.onboarding.repository.OnboardingChecklistRepository;
import com.workfora.onboarding.repository.OnboardingTaskRepository;
import com.workfora.onboarding.repository.OnboardingTemplateRepository;
import com.workfora.onboarding.repository.OnboardingTemplateTaskRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService {

    private final OnboardingTemplateRepository templateRepository;
    private final OnboardingTemplateTaskRepository templateTaskRepository;
    private final OnboardingChecklistRepository checklistRepository;
    private final OnboardingTaskRepository taskRepository;

    public OnboardingService(
            OnboardingTemplateRepository templateRepository,
            OnboardingTemplateTaskRepository templateTaskRepository,
            OnboardingChecklistRepository checklistRepository,
            OnboardingTaskRepository taskRepository
    ) {
        this.templateRepository = templateRepository;
        this.templateTaskRepository = templateTaskRepository;
        this.checklistRepository = checklistRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public Page<TemplateResponse> listTemplates(Pageable pageable) {
        return templateRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable).map(this::toTemplate);
    }

    @Transactional
    public TemplateResponse createTemplate(TemplateRequest request) {
        OnboardingTemplate template = new OnboardingTemplate();
        template.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        template.setName(request.name());
        template.setDescription(request.description());
        template.setActive(request.active() == null || request.active());
        return toTemplate(templateRepository.save(template));
    }

    @Transactional
    public TemplateTaskResponse addTemplateTask(UUID templateId, TemplateTaskRequest request) {
        if (!templateRepository.existsById(templateId)) {
            throw new ResourceNotFoundException("Template not found");
        }
        OnboardingTemplateTask task = new OnboardingTemplateTask();
        task.setTemplateId(templateId);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setSortOrder(request.sortOrder());
        task.setDueDaysOffset(request.dueDaysOffset() != null ? request.dueDaysOffset() : 7);
        OnboardingTemplateTask saved = templateTaskRepository.save(task);
        return new TemplateTaskResponse(saved.getId(), saved.getTitle(), saved.getDescription(), saved.getSortOrder(), saved.getDueDaysOffset());
    }

    @Transactional(readOnly = true)
    public Page<ChecklistResponse> listChecklists(UUID employeeId, Pageable pageable) {
        Page<OnboardingChecklist> page = employeeId != null
                ? checklistRepository.findByEmployeeId(employeeId, pageable)
                : checklistRepository.findAll(pageable);
        return page.map(this::toChecklist);
    }

    @Transactional
    public ChecklistResponse startChecklist(StartChecklistRequest request) {
        OnboardingTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        OnboardingChecklist checklist = new OnboardingChecklist();
        checklist.setEmployeeId(request.employeeId());
        checklist.setTemplateId(template.getId());
        checklist.setStatus("IN_PROGRESS");
        checklist.setStartedAt(Instant.now());
        OnboardingChecklist saved = checklistRepository.save(checklist);

        for (OnboardingTemplateTask templateTask : templateTaskRepository.findByTemplateIdOrderBySortOrderAsc(template.getId())) {
            OnboardingTask task = new OnboardingTask();
            task.setChecklistId(saved.getId());
            task.setTitle(templateTask.getTitle());
            task.setDescription(templateTask.getDescription());
            task.setSortOrder(templateTask.getSortOrder());
            task.setDueDate(LocalDate.now().plusDays(templateTask.getDueDaysOffset()));
            task.setStatus("PENDING");
            taskRepository.save(task);
        }
        return toChecklist(saved);
    }

    @Transactional
    public TaskResponse completeTask(UUID taskId) {
        OnboardingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if ("COMPLETED".equals(task.getStatus())) {
            throw new BusinessException("Task already completed");
        }
        task.setStatus("COMPLETED");
        task.setCompletedAt(Instant.now());
        taskRepository.save(task);

        List<OnboardingTask> tasks = taskRepository.findByChecklistIdOrderBySortOrderAsc(task.getChecklistId());
        boolean allDone = tasks.stream().allMatch(t -> "COMPLETED".equals(t.getStatus()));
        if (allDone) {
            OnboardingChecklist checklist = checklistRepository.findById(task.getChecklistId())
                    .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));
            checklist.setStatus("COMPLETED");
            checklist.setCompletedAt(Instant.now());
            checklistRepository.save(checklist);
        }
        return toTask(task);
    }

    private TemplateResponse toTemplate(OnboardingTemplate t) {
        List<TemplateTaskResponse> tasks = templateTaskRepository.findByTemplateIdOrderBySortOrderAsc(t.getId()).stream()
                .map(x -> new TemplateTaskResponse(x.getId(), x.getTitle(), x.getDescription(), x.getSortOrder(), x.getDueDaysOffset()))
                .toList();
        return new TemplateResponse(t.getId(), t.getName(), t.getDescription(), t.isActive(), tasks);
    }

    private ChecklistResponse toChecklist(OnboardingChecklist c) {
        List<TaskResponse> tasks = taskRepository.findByChecklistIdOrderBySortOrderAsc(c.getId()).stream()
                .map(this::toTask)
                .toList();
        return new ChecklistResponse(c.getId(), c.getEmployeeId(), c.getTemplateId(), c.getStatus(), c.getStartedAt(), c.getCompletedAt(), tasks);
    }

    private TaskResponse toTask(OnboardingTask t) {
        return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getDueDate(), t.getCompletedAt(), t.getAssigneeId(), t.getSortOrder());
    }
}
