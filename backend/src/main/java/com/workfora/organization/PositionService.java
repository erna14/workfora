package com.workfora.organization;

import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.organization.domain.Position;
import com.workfora.organization.dto.PositionRequest;
import com.workfora.organization.dto.PositionResponse;
import com.workfora.organization.repository.DepartmentRepository;
import com.workfora.organization.repository.PositionRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PositionService {

    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    public PositionService(PositionRepository positionRepository, DepartmentRepository departmentRepository) {
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<PositionResponse> list(UUID departmentId, Pageable pageable) {
        if (departmentId != null) {
            return positionRepository.findByDepartmentId(departmentId, pageable).map(OrganizationMapper::toPosition);
        }
        return positionRepository.findAll(pageable).map(OrganizationMapper::toPosition);
    }

    @Transactional(readOnly = true)
    public PositionResponse get(UUID id) {
        return OrganizationMapper.toPosition(find(id));
    }

    @Transactional
    public PositionResponse create(PositionRequest request) {
        ensureDepartment(request.departmentId());
        Position position = new Position();
        apply(position, request);
        return OrganizationMapper.toPosition(positionRepository.save(position));
    }

    @Transactional
    public PositionResponse update(UUID id, PositionRequest request) {
        ensureDepartment(request.departmentId());
        Position position = find(id);
        apply(position, request);
        return OrganizationMapper.toPosition(positionRepository.save(position));
    }

    @Transactional
    public void delete(UUID id) {
        positionRepository.delete(find(id));
    }

    private void ensureDepartment(UUID departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department not found");
        }
    }

    private Position find(UUID id) {
        return positionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Position not found"));
    }

    private void apply(Position position, PositionRequest request) {
        position.setDepartmentId(request.departmentId());
        position.setTitle(request.title());
        position.setLevel(request.level());
        position.setDescription(request.description());
    }
}
