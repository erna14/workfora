package com.workfora.performance.repository;
import com.workfora.performance.domain.PerformanceReview;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {
    Page<PerformanceReview> findByCycleId(UUID cycleId, Pageable pageable);
}
