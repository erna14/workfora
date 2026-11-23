package com.workfora.payroll;

import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.payroll.domain.EmployeeSalary;
import com.workfora.payroll.domain.PayrollPeriod;
import com.workfora.payroll.domain.Payslip;
import com.workfora.payroll.domain.PayslipLine;
import com.workfora.payroll.domain.SalaryComponent;
import com.workfora.payroll.repository.EmployeeSalaryRepository;
import com.workfora.payroll.repository.PayrollPeriodRepository;
import com.workfora.payroll.repository.PayslipLineRepository;
import com.workfora.payroll.repository.PayslipRepository;
import com.workfora.payroll.repository.SalaryComponentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollCalculationService {

    private final PayrollPeriodRepository periodRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final SalaryComponentRepository componentRepository;
    private final PayslipRepository payslipRepository;
    private final PayslipLineRepository payslipLineRepository;

    public PayrollCalculationService(
            PayrollPeriodRepository periodRepository,
            EmployeeSalaryRepository employeeSalaryRepository,
            SalaryComponentRepository componentRepository,
            PayslipRepository payslipRepository,
            PayslipLineRepository payslipLineRepository
    ) {
        this.periodRepository = periodRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
        this.componentRepository = componentRepository;
        this.payslipRepository = payslipRepository;
        this.payslipLineRepository = payslipLineRepository;
    }

    @Transactional
    public List<Payslip> processPeriod(java.util.UUID periodId) {
        PayrollPeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll period not found"));
        if ("CLOSED".equals(period.getStatus())) {
            throw new BusinessException("Payroll period is closed");
        }
        period.setStatus("PROCESSING");
        List<Payslip> created = new ArrayList<>();
        for (EmployeeSalary salary : employeeSalaryRepository.findByEffectiveToIsNull()) {
            Payslip payslip = payslipRepository.findByPeriodIdAndEmployeeId(periodId, salary.getEmployeeId())
                    .orElseGet(Payslip::new);
            if (payslip.getId() != null) {
                payslipLineRepository.deleteByPayslipId(payslip.getId());
            }
            payslip.setPeriodId(periodId);
            payslip.setEmployeeId(salary.getEmployeeId());
            payslip.setStatus("CALCULATED");

            BigDecimal gross = salary.getBasicSalary();
            BigDecimal deductions = BigDecimal.ZERO;
            List<PayslipLine> lines = new ArrayList<>();

            PayslipLine basic = new PayslipLine();
            basic.setComponentName("Basic Salary");
            basic.setComponentType("EARNING");
            basic.setAmount(salary.getBasicSalary());
            lines.add(basic);

            for (SalaryComponent component : componentRepository.findByStructureIdOrderBySortOrderAsc(salary.getStructureId())) {
                BigDecimal amount = resolveAmount(component, salary.getBasicSalary());
                PayslipLine line = new PayslipLine();
                line.setComponentName(component.getName());
                line.setComponentType(component.getComponentType());
                line.setAmount(amount);
                lines.add(line);
                if ("EARNING".equalsIgnoreCase(component.getComponentType())) {
                    gross = gross.add(amount);
                } else if ("DEDUCTION".equalsIgnoreCase(component.getComponentType())) {
                    deductions = deductions.add(amount);
                }
            }

            payslip.setGrossPay(gross);
            payslip.setTotalDeductions(deductions);
            payslip.setNetPay(gross.subtract(deductions));
            Payslip saved = payslipRepository.save(payslip);
            for (PayslipLine line : lines) {
                line.setPayslipId(saved.getId());
            }
            payslipLineRepository.saveAll(lines);
            created.add(saved);
        }
        period.setStatus("CLOSED");
        period.setProcessedAt(Instant.now());
        periodRepository.save(period);
        return created;
    }

    private BigDecimal resolveAmount(SalaryComponent component, BigDecimal basic) {
        if (component.getAmount() != null) {
            return component.getAmount();
        }
        if (component.getPercentage() != null) {
            return basic.multiply(component.getPercentage())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
