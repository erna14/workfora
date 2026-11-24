package com.workfora.recruitment.repository;

import com.workfora.recruitment.domain.RecruitmentStage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RecruitmentStageRepository extends JpaRepository<RecruitmentStage, UUID> {
    List<RecruitmentStage> findByJobOpeningIdOrderBySortOrderAsc(UUID jobOpeningId);
}
