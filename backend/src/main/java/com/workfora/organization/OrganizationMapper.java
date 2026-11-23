package com.workfora.organization;

import com.workfora.organization.domain.Department;
import com.workfora.organization.domain.Location;
import com.workfora.organization.domain.Position;
import com.workfora.organization.domain.Team;
import com.workfora.organization.dto.DepartmentResponse;
import com.workfora.organization.dto.LocationResponse;
import com.workfora.organization.dto.PositionResponse;
import com.workfora.organization.dto.TeamResponse;

public final class OrganizationMapper {

    private OrganizationMapper() {}

    public static LocationResponse toLocation(Location e) {
        return new LocationResponse(e.getId(), e.getOrganizationId(), e.getName(), e.getAddressLine1(), e.getCity(), e.getCountry(), e.getTimezone());
    }

    public static DepartmentResponse toDepartment(Department e) {
        return new DepartmentResponse(e.getId(), e.getOrganizationId(), e.getParentId(), e.getCode(), e.getName(), e.getDescription());
    }

    public static TeamResponse toTeam(Team e) {
        return new TeamResponse(e.getId(), e.getDepartmentId(), e.getName(), e.getDescription());
    }

    public static PositionResponse toPosition(Position e) {
        return new PositionResponse(e.getId(), e.getDepartmentId(), e.getTitle(), e.getLevel(), e.getDescription());
    }
}
