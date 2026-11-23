package com.workfora.performance;

import com.workfora.common.OrgConstants;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.performance.domain.Goal;
import com.workfora.performance.domain.PerformanceCycle;
import com.workfora.performance.domain.PerformanceReview;
import com.workfora.performance.dto.PerformanceDtos.*;
import com.workfora.performance.repository.GoalRepository;
import com.workfora.performance.repository.PerformanceCycleRepository;
import com.workfora.performance.repository.PerformanceReviewRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerformanceService {

    private final PerformanceCycleRepository cycleRepository;
    private final GoalRepository goalRepository;
    private final PerformanceReviewRepository reviewRepository;

    public PerformanceService(
            PerformanceCycleRepository cycleRepository,
            GoalRepository goalRepository,
            PerformanceReviewRepository reviewRepository
    ) {
        this.cycleRepository = cycleRepository;
        this.goalRepository = goalRepository;
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public Page<CycleResponse> listCycles(Pageable pageable) {
        return cycleRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable)
                .map(c -> new CycleResponse(c.getId(), c.getName(), c.getStartDate(), c.getEndDate(), c.getStatus()));
    }

    @Transactional
    public CycleResponse createCycle(CycleRequest request) {
        PerformanceCycle cycle = new PerformanceCycle();
        cycle.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        cycle.setName(request.name());
        cycle.setStartDate(request.startDate());
        cycle.setEndDate(request.endDate());
        cycle.setStatus(request.status() != null ? request.status() : "DRAFT");
        PerformanceCycle saved = cycleRepository.save(cycle);
        return new CycleResponse(saved.getId(), saved.getName(), saved.getStartDate(), saved.getEndDate(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public Page<GoalResponse> listGoals(UUID cycleId, UUID employeeId, Pageable pageable) {
        Page<Goal> page;
        if (cycleId != null) page = goalRepository.findByCycleId(cycleId, pageable);
        else if (employeeId != null) page = goalRepository.findByEmployeeId(employeeId, pageable);
        else page = goalRepository.findAll(pageable);
        return page.map(this::toGoal);
    }

    @Transactional
    public GoalResponse createGoal(GoalRequest request) {
        if (!cycleRepository.existsById(request.cycleId())) {
            throw new ResourceNotFoundException("Performance cycle not found");
        }
        Goal goal = new Goal();
        goal.setCycleId(request.cycleId());
        goal.setEmployeeId(request.employeeId());
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetValue(request.targetValue());
        goal.setWeight(request.weight() != null ? request.weight() : BigDecimal.ONE);
        goal.setCurrentValue(BigDecimal.ZERO);
        goal.setStatus("NOT_STARTED");
        return toGoal(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse updateGoal(UUID id, GoalUpdateRequest request) {
        Goal goal = goalRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        if (request.currentValue() != null) goal.setCurrentValue(request.currentValue());
        if (request.status() != null) goal.setStatus(request.status());
        if (request.description() != null) goal.setDescription(request.description());
        return toGoal(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> listReviews(UUID cycleId, Pageable pageable) {
        Page<PerformanceReview> page = cycleId != null
                ? reviewRepository.findByCycleId(cycleId, pageable)
                : reviewRepository.findAll(pageable);
        return page.map(this::toReview);
    }

    @Transactional
    public ReviewResponse createOrUpdateReview(ReviewRequest request) {
        if (!cycleRepository.existsById(request.cycleId())) {
            throw new ResourceNotFoundException("Performance cycle not found");
        }
        PerformanceReview review = new PerformanceReview();
        review.setCycleId(request.cycleId());
        review.setEmployeeId(request.employeeId());
        review.setReviewerId(request.reviewerId());
        review.setRating(request.rating());
        review.setComments(request.comments());
        String status = request.status() != null ? request.status() : "DRAFT";
        review.setStatus(status);
        if ("SUBMITTED".equals(status)) {
            review.setSubmittedAt(Instant.now());
        }
        return toReview(reviewRepository.save(review));
    }

    private GoalResponse toGoal(Goal g) {
        return new GoalResponse(g.getId(), g.getCycleId(), g.getEmployeeId(), g.getTitle(), g.getDescription(),
                g.getTargetValue(), g.getCurrentValue(), g.getWeight(), g.getStatus());
    }

    private ReviewResponse toReview(PerformanceReview r) {
        return new ReviewResponse(r.getId(), r.getCycleId(), r.getEmployeeId(), r.getReviewerId(),
                r.getRating(), r.getComments(), r.getStatus(), r.getSubmittedAt());
    }
}
