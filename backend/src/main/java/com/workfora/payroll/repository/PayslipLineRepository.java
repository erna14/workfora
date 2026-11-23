package com.workfora.payroll.repository;

import com.workfora.payroll.domain.PayslipLine;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayslipLineRepository extends JpaRepository<PayslipLine, UUID> {
    List<PayslipLine> findByPayslipId(UUID payslipId);
    void deleteByPayslipId(UUID payslipId);
}
