package com.workfora.leave.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
public class Holiday extends BaseEntity {

    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(nullable = false, length = 150) private String name;
    @Column(name = "holiday_date", nullable = false) private LocalDate holidayDate;
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getHolidayDate() { return holidayDate; }
    public void setHolidayDate(LocalDate holidayDate) { this.holidayDate = holidayDate; }

}
