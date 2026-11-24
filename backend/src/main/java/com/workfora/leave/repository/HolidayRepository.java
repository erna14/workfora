package com.workfora.leave.repository;

import com.workfora.leave.domain.Holiday;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {
    Page<Holiday> findByOrganizationId(UUID organizationId, Pageable pageable);
}
