package com.workfora.employee.repository;

import com.workfora.employee.domain.EmploymentHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmploymentHistoryRepository extends JpaRepository<EmploymentHistory, UUID> {
    List<EmploymentHistory> findByEmployeeIdOrderByStartedOnDesc(UUID employeeId);
}
