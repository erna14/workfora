package com.workfora.recruitment.repository;

import com.workfora.recruitment.domain.Applicant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ApplicantRepository extends JpaRepository<Applicant, UUID> {
    Page<Applicant> findByJobOpeningId(UUID jobOpeningId, Pageable pageable);
}
