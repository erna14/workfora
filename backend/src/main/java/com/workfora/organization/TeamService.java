package com.workfora.organization;

import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.organization.domain.Team;
import com.workfora.organization.dto.TeamRequest;
import com.workfora.organization.dto.TeamResponse;
import com.workfora.organization.repository.DepartmentRepository;
import com.workfora.organization.repository.TeamRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final DepartmentRepository departmentRepository;

    public TeamService(TeamRepository teamRepository, DepartmentRepository departmentRepository) {
        this.teamRepository = teamRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<TeamResponse> list(UUID departmentId, Pageable pageable) {
        if (departmentId != null) {
            return teamRepository.findByDepartmentId(departmentId, pageable).map(OrganizationMapper::toTeam);
        }
        return teamRepository.findAll(pageable).map(OrganizationMapper::toTeam);
    }

    @Transactional(readOnly = true)
    public TeamResponse get(UUID id) {
        return OrganizationMapper.toTeam(find(id));
    }

    @Transactional
    public TeamResponse create(TeamRequest request) {
        ensureDepartment(request.departmentId());
        Team team = new Team();
        apply(team, request);
        return OrganizationMapper.toTeam(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse update(UUID id, TeamRequest request) {
        ensureDepartment(request.departmentId());
        Team team = find(id);
        apply(team, request);
        return OrganizationMapper.toTeam(teamRepository.save(team));
    }

    @Transactional
    public void delete(UUID id) {
        teamRepository.delete(find(id));
    }

    private void ensureDepartment(UUID departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department not found");
        }
    }

    private Team find(UUID id) {
        return teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team not found"));
    }

    private void apply(Team team, TeamRequest request) {
        team.setDepartmentId(request.departmentId());
        team.setName(request.name());
        team.setDescription(request.description());
    }
}
