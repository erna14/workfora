package com.workfora.payroll.repository;

import com.workfora.payroll.domain.SalaryComponent;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, UUID> {
    List<SalaryComponent> findByStructureIdOrderBySortOrderAsc(UUID structureId);
}
