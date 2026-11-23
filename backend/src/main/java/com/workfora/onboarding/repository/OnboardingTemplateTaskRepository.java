package com.workfora.onboarding.repository;
import com.workfora.onboarding.domain.OnboardingTemplateTask;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OnboardingTemplateTaskRepository extends JpaRepository<OnboardingTemplateTask, UUID> {
    List<OnboardingTemplateTask> findByTemplateIdOrderBySortOrderAsc(UUID templateId);
}
