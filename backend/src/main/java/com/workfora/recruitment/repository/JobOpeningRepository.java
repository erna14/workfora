package com.workfora.recruitment.repository;
import com.workfora.recruitment.domain.JobOpening;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {
    Page<JobOpening> findByOrganizationId(UUID organizationId, Pageable pageable);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
}
