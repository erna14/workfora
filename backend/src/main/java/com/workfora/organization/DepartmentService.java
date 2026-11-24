package com.workfora.organization;

import com.workfora.security.SecurityUtils;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.organization.domain.Department;
import com.workfora.organization.dto.DepartmentRequest;
import com.workfora.organization.dto.DepartmentResponse;
import com.workfora.organization.repository.DepartmentRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<DepartmentResponse> list(Pageable pageable) {
        return departmentRepository.findByOrganizationId(SecurityUtils.requireOrganizationId(), pageable).map(OrganizationMapper::toDepartment);
    }

    @Transactional(readOnly = true)
    public DepartmentResponse get(UUID id) {
        return OrganizationMapper.toDepartment(find(id));
    }

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByOrganizationIdAndCodeIgnoreCase(SecurityUtils.requireOrganizationId(), request.code())) {
            throw new BusinessException("Department code already exists");
        }
        Department department = new Department();
        department.setOrganizationId(SecurityUtils.requireOrganizationId());
        apply(department, request);
        return OrganizationMapper.toDepartment(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse update(UUID id, DepartmentRequest request) {
        Department department = find(id);
        apply(department, request);
        return OrganizationMapper.toDepartment(departmentRepository.save(department));
    }

    @Transactional
    public void delete(UUID id) {
        departmentRepository.delete(find(id));
    }

    private Department find(UUID id) {
        return departmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    private void apply(Department department, DepartmentRequest request) {
        department.setCode(request.code());
        department.setName(request.name());
        department.setDescription(request.description());
        department.setParentId(request.parentId());
    }
}
