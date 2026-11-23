package com.workfora.payroll.repository;

import com.workfora.payroll.domain.Payslip;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    Page<Payslip> findByPeriodId(UUID periodId, Pageable pageable);
    Optional<Payslip> findByPeriodIdAndEmployeeId(UUID periodId, UUID employeeId);
}
