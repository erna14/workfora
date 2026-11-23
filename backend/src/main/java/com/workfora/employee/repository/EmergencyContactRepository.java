package com.workfora.employee.repository;

import com.workfora.employee.domain.EmergencyContact;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, UUID> {
    List<EmergencyContact> findByEmployeeId(UUID employeeId);
}
