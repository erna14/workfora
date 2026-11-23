package com.workfora.payroll.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;


@Entity
@Table(name = "salary_structures")
public class SalaryStructure extends BaseEntity {

    @Column(name = "organization_id", nullable = false) private UUID organizationId;
    @Column(nullable = false, length = 150) private String name;
    @Column(nullable = false, length = 10) private String currency = "USD";
    @Column(length = 500) private String description;
    @Column(nullable = false) private boolean active = true;
    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

}
