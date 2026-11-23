package com.workfora.payroll.repository;

import com.workfora.payroll.domain.EmployeeSalary;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, UUID> {
    Optional<EmployeeSalary> findFirstByEmployeeIdAndEffectiveToIsNullOrderByEffectiveFromDesc(UUID employeeId);
    List<EmployeeSalary> findByEffectiveToIsNull();
}
