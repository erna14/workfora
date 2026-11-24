package com.workfora.organization.repository;

import com.workfora.organization.domain.Team;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    org.springframework.data.domain.Page<Team> findByDepartmentId(java.util.UUID departmentId, org.springframework.data.domain.Pageable pageable);
    boolean existsByDepartmentId(java.util.UUID departmentId);
    org.springframework.data.domain.Page<Team> findAllBy(org.springframework.data.domain.Pageable pageable);
}
