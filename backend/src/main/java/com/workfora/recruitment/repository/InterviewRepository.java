package com.workfora.recruitment.repository;

import com.workfora.recruitment.domain.Interview;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    Page<Interview> findByApplicantId(UUID applicantId, Pageable pageable);
}
