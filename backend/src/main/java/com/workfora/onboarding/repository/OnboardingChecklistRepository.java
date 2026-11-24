package com.workfora.onboarding.repository;

import com.workfora.onboarding.domain.OnboardingChecklist;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OnboardingChecklistRepository extends JpaRepository<OnboardingChecklist, UUID> {
    Page<OnboardingChecklist> findByEmployeeId(UUID employeeId, Pageable pageable);
}
