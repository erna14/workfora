package com.workfora.attendance.repository;

import com.workfora.attendance.domain.WorkSchedule;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {
    Optional<WorkSchedule> findFirstByOrganizationIdAndIsDefaultTrue(UUID organizationId);
}
