package com.workfora.payroll.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "payslip_lines")
public class PayslipLine extends BaseEntity {

    @Column(name = "payslip_id", nullable = false) private UUID payslipId;
    @Column(name = "component_name", nullable = false, length = 100) private String componentName;
    @Column(name = "component_type", nullable = false, length = 30) private String componentType;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    public UUID getPayslipId() { return payslipId; }
    public void setPayslipId(UUID payslipId) { this.payslipId = payslipId; }
    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }
    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

}
