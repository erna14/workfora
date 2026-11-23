package com.workfora.employee;

import com.workfora.audit.AuditService;
import com.workfora.common.OrgConstants;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.dto.EmployeeCreateRequest;
import com.workfora.employee.dto.EmployeeDetailResponse;
import com.workfora.employee.dto.EmployeeListItemResponse;
import com.workfora.employee.dto.EmployeeUpdateRequest;
import com.workfora.employee.repository.EmergencyContactRepository;
import com.workfora.employee.repository.EmployeeDocumentRepository;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.employee.repository.EmploymentHistoryRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final EmploymentHistoryRepository employmentHistoryRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final AuditService auditService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            EmergencyContactRepository emergencyContactRepository,
            EmploymentHistoryRepository employmentHistoryRepository,
            EmployeeDocumentRepository employeeDocumentRepository,
            AuditService auditService
    ) {
        this.employeeRepository = employeeRepository;
        this.emergencyContactRepository = emergencyContactRepository;
        this.employmentHistoryRepository = employmentHistoryRepository;
        this.employeeDocumentRepository = employeeDocumentRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeListItemResponse> list(String search, EmployeeStatus status, UUID departmentId, Pageable pageable) {
        return employeeRepository.search(OrgConstants.DEFAULT_ORG_ID, search, status, departmentId, pageable)
                .map(EmployeeMapper::toListItem);
    }

    @Transactional(readOnly = true)
    public EmployeeDetailResponse get(UUID id) {
        Employee employee = find(id);
        return EmployeeMapper.toDetail(
                employee,
                emergencyContactRepository.findByEmployeeId(id),
                employmentHistoryRepository.findByEmployeeIdOrderByStartedOnDesc(id),
                employeeDocumentRepository.findByEmployeeId(id)
        );
    }

    @Transactional
    public EmployeeDetailResponse create(EmployeeCreateRequest request) {
        if (employeeRepository.existsByWorkEmailIgnoreCase(request.workEmail())) {
            throw new BusinessException("Work email already exists");
        }
        if (employeeRepository.existsByOrganizationIdAndEmployeeNumber(OrgConstants.DEFAULT_ORG_ID, request.employeeNumber())) {
            throw new BusinessException("Employee number already exists");
        }
        Employee employee = new Employee();
        employee.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        employee.setEmployeeNumber(request.employeeNumber());
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setWorkEmail(request.workEmail());
        employee.setPersonalEmail(request.personalEmail());
        employee.setPhone(request.phone());
        employee.setStatus(request.status() != null ? request.status() : EmployeeStatus.ACTIVE);
        employee.setHireDate(request.hireDate());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setDepartmentId(request.departmentId());
        employee.setPositionId(request.positionId());
        employee.setTeamId(request.teamId());
        employee.setManagerId(request.managerId());
        employee.setLocationId(request.locationId());
        employee.setJobTitle(request.jobTitle());
        Employee saved = employeeRepository.save(employee);
        auditService.log("EMPLOYEE_CREATED", "Employee", saved.getId(), "Created employee " + saved.getWorkEmail());
        return get(saved.getId());
    }

    @Transactional
    public EmployeeDetailResponse update(UUID id, EmployeeUpdateRequest request) {
        Employee employee = find(id);
        if (request.firstName() != null) employee.setFirstName(request.firstName());
        if (request.lastName() != null) employee.setLastName(request.lastName());
        if (request.personalEmail() != null) employee.setPersonalEmail(request.personalEmail());
        if (request.phone() != null) employee.setPhone(request.phone());
        if (request.hireDate() != null) employee.setHireDate(request.hireDate());
        if (request.dateOfBirth() != null) employee.setDateOfBirth(request.dateOfBirth());
        if (request.departmentId() != null) employee.setDepartmentId(request.departmentId());
        if (request.positionId() != null) employee.setPositionId(request.positionId());
        if (request.teamId() != null) employee.setTeamId(request.teamId());
        if (request.managerId() != null) employee.setManagerId(request.managerId());
        if (request.locationId() != null) employee.setLocationId(request.locationId());
        if (request.jobTitle() != null) employee.setJobTitle(request.jobTitle());
        employeeRepository.save(employee);
        auditService.log("EMPLOYEE_UPDATED", "Employee", id, "Updated employee");
        return get(id);
    }

    @Transactional
    public EmployeeDetailResponse deactivate(UUID id) {
        Employee employee = find(id);
        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setDeactivatedAt(Instant.now());
        employeeRepository.save(employee);
        auditService.log("EMPLOYEE_DEACTIVATED", "Employee", id, null);
        return get(id);
    }

    @Transactional
    public EmployeeDetailResponse activate(UUID id) {
        Employee employee = find(id);
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setDeactivatedAt(null);
        employeeRepository.save(employee);
        auditService.log("EMPLOYEE_ACTIVATED", "Employee", id, null);
        return get(id);
    }

    private Employee find(UUID id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }
}
