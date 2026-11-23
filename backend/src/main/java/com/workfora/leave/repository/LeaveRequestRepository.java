package com.workfora.leave.repository;

import com.workfora.leave.domain.LeaveRequest;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    Page<LeaveRequest> findByEmployeeId(UUID employeeId, Pageable pageable);

    Page<LeaveRequest> findByStatus(String status, Pageable pageable);

    long countByStatus(String status);

    @Query("""
            SELECT COUNT(DISTINCT lr.employeeId) FROM LeaveRequest lr
            WHERE lr.status = 'APPROVED'
              AND lr.startDate <= :today
              AND lr.endDate >= :today
            """)
    long countEmployeesOnLeave(@Param("today") LocalDate today);
}
