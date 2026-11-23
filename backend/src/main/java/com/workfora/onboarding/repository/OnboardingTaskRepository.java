package com.workfora.onboarding.repository;
import com.workfora.onboarding.domain.OnboardingTask;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, UUID> {
    List<OnboardingTask> findByChecklistIdOrderBySortOrderAsc(UUID checklistId);
}
