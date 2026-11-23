package com.workfora.payroll.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "payslips")
public class Payslip extends BaseEntity {

    @Column(name = "period_id", nullable = false) private UUID periodId;
    @Column(name = "employee_id", nullable = false) private UUID employeeId;
    @Column(name = "gross_pay", nullable = false, precision = 12, scale = 2) private BigDecimal grossPay = BigDecimal.ZERO;
    @Column(name = "total_deductions", nullable = false, precision = 12, scale = 2) private BigDecimal totalDeductions = BigDecimal.ZERO;
    @Column(name = "net_pay", nullable = false, precision = 12, scale = 2) private BigDecimal netPay = BigDecimal.ZERO;
    @Column(nullable = false, length = 30) private String status = "DRAFT";
    public UUID getPeriodId() { return periodId; }
    public void setPeriodId(UUID periodId) { this.periodId = periodId; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public BigDecimal getGrossPay() { return grossPay; }
    public void setGrossPay(BigDecimal grossPay) { this.grossPay = grossPay; }
    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }
    public BigDecimal getNetPay() { return netPay; }
    public void setNetPay(BigDecimal netPay) { this.netPay = netPay; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

}
