package com.workfora.performance.repository;
import com.workfora.performance.domain.PerformanceCycle;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PerformanceCycleRepository extends JpaRepository<PerformanceCycle, UUID> {
    Page<PerformanceCycle> findByOrganizationId(UUID organizationId, Pageable pageable);
}
