package com.workfora.organization;

import com.workfora.common.OrgConstants;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.organization.domain.Location;
import com.workfora.organization.dto.LocationRequest;
import com.workfora.organization.dto.LocationResponse;
import com.workfora.organization.repository.LocationRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public Page<LocationResponse> list(Pageable pageable) {
        return locationRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable).map(OrganizationMapper::toLocation);
    }

    @Transactional(readOnly = true)
    public LocationResponse get(UUID id) {
        return OrganizationMapper.toLocation(find(id));
    }

    @Transactional
    public LocationResponse create(LocationRequest request) {
        Location location = new Location();
        location.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        apply(location, request);
        return OrganizationMapper.toLocation(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse update(UUID id, LocationRequest request) {
        Location location = find(id);
        apply(location, request);
        return OrganizationMapper.toLocation(locationRepository.save(location));
    }

    @Transactional
    public void delete(UUID id) {
        locationRepository.delete(find(id));
    }

    private Location find(UUID id) {
        return locationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Location not found"));
    }

    private void apply(Location location, LocationRequest request) {
        location.setName(request.name());
        location.setAddressLine1(request.addressLine1());
        location.setCity(request.city());
        location.setCountry(request.country());
        location.setTimezone(request.timezone() != null ? request.timezone() : "UTC");
    }
}
