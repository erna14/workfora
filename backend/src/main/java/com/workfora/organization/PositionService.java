package com.workfora.organization;

import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.organization.domain.Department;
import com.workfora.organization.domain.OrgUnitStatus;
import com.workfora.organization.domain.Position;
import com.workfora.organization.dto.PositionRequest;
import com.workfora.organization.dto.PositionResponse;
import com.workfora.organization.repository.DepartmentRepository;
import com.workfora.organization.repository.PositionRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PositionService {

    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationAccess organizationAccess;

    public PositionService(
            PositionRepository positionRepository,
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository,
            OrganizationAccess organizationAccess
    ) {
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.organizationAccess = organizationAccess;
    }

    @Transactional(readOnly = true)
    public Page<PositionResponse> list(
            UUID requestedOrganizationId,
            UUID departmentId,
            String search,
            OrgUnitStatus status,
            Pageable pageable
    ) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        if (departmentId != null) {
            requireDepartment(organizationId, departmentId);
        }
        return mapPage(positionRepository.search(
                organizationId,
                search == null ? "" : search.trim(),
                departmentId != null,
                departmentId == null ? new UUID(0, 0) : departmentId,
                status != null,
                status == null ? OrgUnitStatus.ACTIVE : status,
                pageable
        ));
    }

    @Transactional(readOnly = true)
    public PositionResponse get(UUID requestedOrganizationId, UUID id) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        return toResponse(find(organizationId, id));
    }

    @Transactional
    public PositionResponse create(UUID requestedOrganizationId, PositionRequest request) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Department department = requireDepartment(organizationId, request.departmentId());
        String title = request.title().trim();
        ensureUniqueTitle(department.getId(), title, null);
        Position position = new Position();
        position.setOrganizationId(organizationId);
        apply(position, department, request, title);
        return toResponse(positionRepository.save(position));
    }

    @Transactional
    public PositionResponse update(UUID requestedOrganizationId, UUID id, PositionRequest request) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Position position = find(organizationId, id);
        Department department = requireDepartment(organizationId, request.departmentId());
        String title = request.title().trim();
        ensureUniqueTitle(department.getId(), title, id);
        position.setOrganizationId(organizationId);
        apply(position, department, request, title);
        return toResponse(positionRepository.save(position));
    }

    @Transactional
    public PositionResponse updateStatus(UUID requestedOrganizationId, UUID id, OrgUnitStatus status) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Position position = find(organizationId, id);
        position.setStatus(status);
        return toResponse(positionRepository.save(position));
    }

    @Transactional
    public void delete(UUID requestedOrganizationId, UUID id) {
        UUID organizationId = organizationAccess.require(requestedOrganizationId);
        Position position = find(organizationId, id);
        if (employeeRepository.existsByPositionId(position.getId())) {
            throw new BusinessException(
                    "This position cannot be deleted because employees are still assigned to it. Deactivate it instead."
            );
        }
        positionRepository.delete(position);
    }

    private Position find(UUID organizationId, UUID id) {
        return positionRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Position not found"));
    }

    private Department requireDepartment(UUID organizationId, UUID departmentId) {
        return departmentRepository.findByIdAndOrganizationId(departmentId, organizationId)
                .orElseThrow(() -> new BusinessException("Department was not found in this organization"));
    }

    private void ensureUniqueTitle(UUID departmentId, String title, UUID currentId) {
        boolean taken = currentId == null
                ? positionRepository.existsByDepartmentIdAndTitleIgnoreCase(departmentId, title)
                : positionRepository.existsByDepartmentIdAndTitleIgnoreCaseAndIdNot(departmentId, title, currentId);
        if (taken) {
            throw new BusinessException("A position with this title already exists in the department");
        }
    }

    private void apply(Position position, Department department, PositionRequest request, String title) {
        position.setDepartmentId(department.getId());
        position.setTitle(title);
        position.setLevel(blankToNull(request.level()));
        position.setDescription(blankToNull(request.description()));
        if (request.status() != null) {
            position.setStatus(request.status());
        } else if (position.getStatus() == null) {
            position.setStatus(OrgUnitStatus.ACTIVE);
        }
    }

    private PositionResponse toResponse(Position position) {
        String departmentName = departmentRepository.findById(position.getDepartmentId())
                .map(Department::getName)
                .orElse(null);
        long employees = employeeRepository.existsByPositionId(position.getId())
                ? toCountMap(employeeRepository.countGroupedByPositionId(List.of(position.getId())))
                        .getOrDefault(position.getId(), 0L)
                : 0;
        return OrganizationMapper.toPosition(position, departmentName, employees);
    }

    private Page<PositionResponse> mapPage(Page<Position> page) {
        List<Position> rows = page.getContent();
        if (rows.isEmpty()) {
            return page.map(position -> OrganizationMapper.toPosition(position, null, 0));
        }
        Set<UUID> ids = rows.stream().map(Position::getId).collect(Collectors.toSet());
        Set<UUID> departmentIds = rows.stream().map(Position::getDepartmentId).collect(Collectors.toSet());
        Map<UUID, String> departmentNames = new HashMap<>();
        for (Department department : departmentRepository.findAllById(departmentIds)) {
            departmentNames.put(department.getId(), department.getName());
        }
        Map<UUID, Long> employees = toCountMap(employeeRepository.countGroupedByPositionId(ids));
        return page.map(position -> OrganizationMapper.toPosition(
                position,
                departmentNames.get(position.getDepartmentId()),
                employees.getOrDefault(position.getId(), 0L)
        ));
    }

    private static Map<UUID, Long> toCountMap(List<Object[]> rows) {
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
