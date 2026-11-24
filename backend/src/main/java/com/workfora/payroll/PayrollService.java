package com.workfora.payroll;

import com.workfora.security.SecurityUtils;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.payroll.domain.*;
import com.workfora.payroll.dto.PayrollDtos.*;
import com.workfora.payroll.repository.*;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollService {

    private final SalaryStructureRepository structureRepository;
    private final SalaryComponentRepository componentRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final PayrollPeriodRepository periodRepository;
    private final PayslipRepository payslipRepository;
    private final PayslipLineRepository payslipLineRepository;
    private final PayrollCalculationService calculationService;

    public PayrollService(
            SalaryStructureRepository structureRepository,
            SalaryComponentRepository componentRepository,
            EmployeeSalaryRepository employeeSalaryRepository,
            PayrollPeriodRepository periodRepository,
            PayslipRepository payslipRepository,
            PayslipLineRepository payslipLineRepository,
            PayrollCalculationService calculationService
    ) {
        this.structureRepository = structureRepository;
        this.componentRepository = componentRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
        this.periodRepository = periodRepository;
        this.payslipRepository = payslipRepository;
        this.payslipLineRepository = payslipLineRepository;
        this.calculationService = calculationService;
    }

    @Transactional(readOnly = true)
    public Page<StructureResponse> listStructures(Pageable pageable) {
        return structureRepository.findByOrganizationId(SecurityUtils.requireOrganizationId(), pageable).map(this::toStructure);
    }

    @Transactional
    public StructureResponse createStructure(StructureRequest request) {
        SalaryStructure structure = new SalaryStructure();
        structure.setOrganizationId(SecurityUtils.requireOrganizationId());
        structure.setName(request.name());
        structure.setCurrency(request.currency() != null ? request.currency() : "USD");
        structure.setDescription(request.description());
        return toStructure(structureRepository.save(structure));
    }

    @Transactional
    public ComponentResponse addComponent(UUID structureId, ComponentRequest request) {
        if (!structureRepository.existsById(structureId)) {
            throw new ResourceNotFoundException("Salary structure not found");
        }
        SalaryComponent component = new SalaryComponent();
        component.setStructureId(structureId);
        component.setName(request.name());
        component.setComponentType(request.componentType());
        component.setAmount(request.amount());
        component.setPercentage(request.percentage());
        component.setSortOrder(request.sortOrder());
        SalaryComponent saved = componentRepository.save(component);
        return new ComponentResponse(saved.getId(), saved.getName(), saved.getComponentType(), saved.getAmount(), saved.getPercentage(), saved.getSortOrder());
    }

    @Transactional
    public EmployeeSalaryResponse assignSalary(EmployeeSalaryRequest request) {
        EmployeeSalary salary = new EmployeeSalary();
        salary.setEmployeeId(request.employeeId());
        salary.setStructureId(request.structureId());
        salary.setBasicSalary(request.basicSalary());
        salary.setEffectiveFrom(request.effectiveFrom());
        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        return new EmployeeSalaryResponse(saved.getId(), saved.getEmployeeId(), saved.getStructureId(), saved.getBasicSalary(), saved.getEffectiveFrom(), saved.getEffectiveTo());
    }

    @Transactional(readOnly = true)
    public Page<PeriodResponse> listPeriods(Pageable pageable) {
        return periodRepository.findByOrganizationId(SecurityUtils.requireOrganizationId(), pageable)
                .map(p -> new PeriodResponse(p.getId(), p.getName(), p.getStartDate(), p.getEndDate(), p.getStatus(), p.getProcessedAt()));
    }

    @Transactional
    public PeriodResponse createPeriod(PeriodRequest request) {
        PayrollPeriod period = new PayrollPeriod();
        period.setOrganizationId(SecurityUtils.requireOrganizationId());
        period.setName(request.name());
        period.setStartDate(request.startDate());
        period.setEndDate(request.endDate());
        period.setStatus("OPEN");
        PayrollPeriod saved = periodRepository.save(period);
        return new PeriodResponse(saved.getId(), saved.getName(), saved.getStartDate(), saved.getEndDate(), saved.getStatus(), saved.getProcessedAt());
    }

    @Transactional
    public List<PayslipResponse> process(UUID periodId) {
        return calculationService.processPeriod(periodId).stream().map(this::toPayslip).toList();
    }

    @Transactional(readOnly = true)
    public Page<PayslipResponse> listPayslips(UUID periodId, Pageable pageable) {
        return payslipRepository.findByPeriodId(periodId, pageable).map(this::toPayslip);
    }

    @Transactional(readOnly = true)
    public PayslipResponse getPayslip(UUID id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found"));
        return toPayslip(payslip);
    }

    private StructureResponse toStructure(SalaryStructure s) {
        List<ComponentResponse> components = componentRepository.findByStructureIdOrderBySortOrderAsc(s.getId()).stream()
                .map(c -> new ComponentResponse(c.getId(), c.getName(), c.getComponentType(), c.getAmount(), c.getPercentage(), c.getSortOrder()))
                .toList();
        return new StructureResponse(s.getId(), s.getName(), s.getCurrency(), s.getDescription(), s.isActive(), components);
    }

    private PayslipResponse toPayslip(Payslip p) {
        List<PayslipLineResponse> lines = payslipLineRepository.findByPayslipId(p.getId()).stream()
                .map(l -> new PayslipLineResponse(l.getId(), l.getComponentName(), l.getComponentType(), l.getAmount()))
                .toList();
        return new PayslipResponse(p.getId(), p.getPeriodId(), p.getEmployeeId(), p.getGrossPay(), p.getTotalDeductions(), p.getNetPay(), p.getStatus(), lines);
    }
}
