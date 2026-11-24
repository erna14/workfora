package com.workfora.organization;

import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.organization.domain.Department;
import com.workfora.organization.domain.OrgUnitStatus;
import com.workfora.organization.dto.DepartmentRequest;
import com.workfora.organization.dto.DepartmentResponse;
import com.workfora.organization.repository.DepartmentRepository;
import com.workfora.organization.repository.PositionRepository;
import com.workfora.organization.repository.TeamRepository;
import com.workfora.recruitment.repository.JobOpeningRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final TeamRepository teamRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final OrganizationAccess organizationAccess;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            EmployeeRepository employeeRepository,
            TeamRepository teamRepository,
            JobOpeningRepository jobOpeningRepository,
            OrganizationAccess organizationAccess
    ) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.employeeRepository = employeeRepository;
        this.teamRepository = teamRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.organizationAccess = organizationAccess;
    }

    @Transactional(readOnly = true)
    public Page<DepartmentResponse> list(UUID requestedOrganizationId, String search, OrgUnitStatus status, Pageable pageable) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        return mapPage(departmentRepository.search(
                organizationId,
                search == null ? "" : search.trim(),
                status != null,
                status == null ? OrgUnitStatus.ACTIVE : status,
                pageable
        ));
    }

    @Transactional(readOnly = true)
    public DepartmentResponse get(UUID requestedOrganizationId, UUID id) {
        return toResponse(find(organizationAccess.require(requestedOrganizationId), id));
    }

    @Transactional
    public DepartmentResponse create(UUID requestedOrganizationId, DepartmentRequest request) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        String code = request.code().trim();
        String name = request.name().trim();
        ensureUnique(organizationId, code, name, null);
        ensureParent(organizationId, null, request.parentId());
        ensureManager(organizationId, request.managerEmployeeId());

        Department department = new Department();
        department.setOrganizationId(organizationId);
        apply(department, request, code, name);
        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse update(UUID requestedOrganizationId, UUID id, DepartmentRequest request) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Department department = find(organizationId, id);
        String code = request.code().trim();
        String name = request.name().trim();
        ensureUnique(organizationId, code, name, id);
        ensureParent(organizationId, id, request.parentId());
        ensureManager(organizationId, request.managerEmployeeId());
        apply(department, request, code, name);
        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse updateStatus(UUID requestedOrganizationId, UUID id, OrgUnitStatus status) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Department department = find(organizationId, id);
        department.setStatus(status);
        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void delete(UUID requestedOrganizationId, UUID id) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Department department = find(organizationId, id);
        String blockers = deleteBlockers(department.getId());
        if (blockers != null) {
            throw new BusinessException(
                    "This department cannot be deleted because it still has " + blockers
                            + ". Deactivate it instead."
            );
        }
        departmentRepository.delete(department);
    }

    private Department find(UUID organizationId, UUID id) {
        return departmentRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    private void apply(Department department, DepartmentRequest request, String code, String name) {
        department.setCode(code);
        department.setName(name);
        department.setDescription(blankToNull(request.description()));
        department.setParentId(request.parentId());
        department.setManagerEmployeeId(request.managerEmployeeId());
        if (request.status() != null) {
            department.setStatus(request.status());
        } else if (department.getStatus() == null) {
            department.setStatus(OrgUnitStatus.ACTIVE);
        }
    }

    private void ensureUnique(UUID organizationId, String code, String name, UUID currentId) {
        boolean codeTaken = currentId == null
                ? departmentRepository.existsByOrganizationIdAndCodeIgnoreCase(organizationId, code)
                : departmentRepository.existsByOrganizationIdAndCodeIgnoreCaseAndIdNot(organizationId, code, currentId);
        if (codeTaken) {
            throw new BusinessException("A department with this code already exists in the organization");
        }
        boolean nameTaken = currentId == null
                ? departmentRepository.existsByOrganizationIdAndNameIgnoreCase(organizationId, name)
                : departmentRepository.existsByOrganizationIdAndNameIgnoreCaseAndIdNot(organizationId, name, currentId);
        if (nameTaken) {
            throw new BusinessException("A department with this name already exists in the organization");
        }
    }

    private void ensureParent(UUID organizationId, UUID departmentId, UUID parentId) {
        if (parentId == null) {
            return;
        }
        if (parentId.equals(departmentId)) {
            throw new BusinessException("A department cannot be its own parent");
        }
        if (!departmentRepository.existsByIdAndOrganizationId(parentId, organizationId)) {
            throw new BusinessException("Parent department was not found in this organization");
        }
    }

    private void ensureManager(UUID organizationId, UUID managerId) {
        if (managerId == null) {
            return;
        }
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Department head not found"));
        if (!organizationId.equals(manager.getOrganizationId())) {
            throw new BusinessException("Department head must belong to the same organization");
        }
    }

    private String deleteBlockers(UUID departmentId) {
        List<String> reasons = new java.util.ArrayList<>();
        if (employeeRepository.existsByDepartmentId(departmentId)) {
            reasons.add("employees");
        }
        if (positionRepository.existsByDepartmentId(departmentId)) {
            reasons.add("positions");
        }
        if (teamRepository.existsByDepartmentId(departmentId)) {
            reasons.add("teams");
        }
        if (jobOpeningRepository.existsByDepartmentId(departmentId)) {
            reasons.add("job openings");
        }
        if (departmentRepository.existsByParentId(departmentId)) {
            reasons.add("child departments");
        }
        if (reasons.isEmpty()) {
            return null;
        }
        return String.join(", ", reasons);
    }

    private DepartmentResponse toResponse(Department department) {
        String managerName = null;
        if (department.getManagerEmployeeId() != null) {
            managerName = employeeRepository.findById(department.getManagerEmployeeId())
                    .map(employee -> (employee.getFirstName() + " " + employee.getLastName()).trim())
                    .orElse(null);
        }
        long employees = employeeRepository.existsByDepartmentId(department.getId())
                ? count(employeeRepository.countGroupedByDepartmentId(List.of(department.getId())), department.getId())
                : 0;
        long positions = positionRepository.existsByDepartmentId(department.getId())
                ? count(positionRepository.countGroupedByDepartmentId(List.of(department.getId())), department.getId())
                : 0;
        return OrganizationMapper.toDepartment(department, managerName, employees, positions);
    }

    private Page<DepartmentResponse> mapPage(Page<Department> page) {
        List<Department> rows = page.getContent();
        if (rows.isEmpty()) {
            return page.map(department -> OrganizationMapper.toDepartment(department, null, 0, 0));
        }
        Set<UUID> ids = rows.stream().map(Department::getId).collect(Collectors.toSet());
        Map<UUID, Long> employees = toCountMap(employeeRepository.countGroupedByDepartmentId(ids));
        Map<UUID, Long> positions = toCountMap(positionRepository.countGroupedByDepartmentId(ids));
        Map<UUID, String> managers = managerNames(rows);
        return page.map(department -> OrganizationMapper.toDepartment(
                department,
                department.getManagerEmployeeId() == null ? null : managers.get(department.getManagerEmployeeId()),
                employees.getOrDefault(department.getId(), 0L),
                positions.getOrDefault(department.getId(), 0L)
        ));
    }

    private Map<UUID, String> managerNames(List<Department> rows) {
        Set<UUID> managerIds = rows.stream()
                .map(Department::getManagerEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (managerIds.isEmpty()) {
            return new HashMap<>();
        }
        Map<UUID, String> names = new HashMap<>();
        for (Object[] row : employeeRepository.findNamesByIdIn(managerIds)) {
            names.put((UUID) row[0], (((String) row[1]) + " " + ((String) row[2])).trim());
        }
        return names;
    }

    private static long count(List<Object[]> rows, UUID id) {
        return toCountMap(rows).getOrDefault(id, 0L);
    }

    private static Map<UUID, Long> toCountMap(Collection<Object[]> rows) {
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] != null) {
                map.put((UUID) row[0], ((Number) row[1]).longValue());
            }
        }
        return map;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
