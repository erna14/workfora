package com.workfora.payroll.repository;

import com.workfora.payroll.domain.PayrollPeriod;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, UUID> {
    Page<PayrollPeriod> findByOrganizationId(UUID organizationId, Pageable pageable);
}
