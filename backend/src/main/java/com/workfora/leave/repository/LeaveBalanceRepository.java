package com.workfora.leave.repository;

import com.workfora.leave.domain.LeaveBalance;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    List<LeaveBalance> findByEmployeeIdAndBalanceYear(UUID employeeId, int balanceYear);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndBalanceYear(
            UUID employeeId, UUID leaveTypeId, int balanceYear
    );
}
