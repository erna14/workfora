package com.workfora.onboarding.repository;

import com.workfora.onboarding.domain.OnboardingTemplate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OnboardingTemplateRepository extends JpaRepository<OnboardingTemplate, UUID> {
    Page<OnboardingTemplate> findByOrganizationId(UUID organizationId, Pageable pageable);
}
