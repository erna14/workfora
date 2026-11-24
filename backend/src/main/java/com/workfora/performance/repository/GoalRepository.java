package com.workfora.performance.repository;

import com.workfora.performance.domain.Goal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface GoalRepository extends JpaRepository<Goal, UUID> {
    Page<Goal> findByCycleId(UUID cycleId, Pageable pageable);
    Page<Goal> findByEmployeeId(UUID employeeId, Pageable pageable);
}
