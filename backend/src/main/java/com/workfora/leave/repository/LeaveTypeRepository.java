package com.workfora.leave.repository;

import com.workfora.leave.domain.LeaveType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {
    List<LeaveType> findByOrganizationId(UUID organizationId);
}
