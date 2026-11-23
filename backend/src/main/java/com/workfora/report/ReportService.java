package com.workfora.report;

import com.workfora.asset.repository.AssetRepository;
import com.workfora.common.OrgConstants;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.leave.repository.LeaveRequestRepository;
import com.workfora.recruitment.repository.JobOpeningRepository;
import com.workfora.report.dto.ReportSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final AssetRepository assetRepository;

    public ReportService(
            EmployeeRepository employeeRepository,
            LeaveRequestRepository leaveRequestRepository,
            JobOpeningRepository jobOpeningRepository,
            AssetRepository assetRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public ReportSummaryResponse summary() {
        long active = employeeRepository.countByOrganizationIdAndStatus(OrgConstants.DEFAULT_ORG_ID, EmployeeStatus.ACTIVE);
        long total = employeeRepository.count();
        return new ReportSummaryResponse(
                total,
                active,
                leaveRequestRepository.countByStatus("PENDING"),
                jobOpeningRepository.countByOrganizationIdAndStatus(OrgConstants.DEFAULT_ORG_ID, "OPEN"),
                assetRepository.countByOrganizationIdAndStatus(OrgConstants.DEFAULT_ORG_ID, "AVAILABLE")
        );
    }
}
