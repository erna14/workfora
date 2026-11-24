package com.workfora.organization.dto;

import com.workfora.organization.domain.OrgUnitStatus;
import jakarta.validation.constraints.NotNull;

public record OrgUnitStatusRequest(@NotNull OrgUnitStatus status) {}
