package com.workfora.performance.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "goals")
public class Goal extends BaseEntity {
    @Column(name = "cycle_id", nullable = false) private UUID cycleId;
    @Column(name = "employee_id", nullable = false) private UUID employeeId;
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 2000) private String description;
    @Column(name = "target_value", precision = 12, scale = 2) private BigDecimal targetValue;
    @Column(name = "current_value", precision = 12, scale = 2) private BigDecimal currentValue = BigDecimal.ZERO;
    @Column(precision = 5, scale = 2) private BigDecimal weight = BigDecimal.ONE;
    @Column(nullable = false, length = 30) private String status = "NOT_STARTED";
    public UUID getCycleId() { return cycleId; }
    public void setCycleId(UUID cycleId) { this.cycleId = cycleId; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getTargetValue() { return targetValue; }
    public void setTargetValue(BigDecimal targetValue) { this.targetValue = targetValue; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
