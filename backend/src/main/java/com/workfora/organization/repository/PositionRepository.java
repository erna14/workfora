package com.workfora.organization.repository;

import com.workfora.organization.domain.Position;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position, UUID> {
    org.springframework.data.domain.Page<Position> findByDepartmentId(java.util.UUID departmentId, org.springframework.data.domain.Pageable pageable);
}
