package com.workfora.payroll.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "salary_components")
public class SalaryComponent extends BaseEntity {

    @Column(name = "structure_id", nullable = false) private UUID structureId;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "component_type", nullable = false, length = 30) private String componentType;
    @Column(precision = 12, scale = 2) private BigDecimal amount;
    @Column(precision = 8, scale = 4) private BigDecimal percentage;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    public UUID getStructureId() { return structureId; }
    public void setStructureId(UUID structureId) { this.structureId = structureId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getPercentage() { return percentage; }
    public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

}
