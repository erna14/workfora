package com.workfora.dashboard;

import com.workfora.audit.domain.AuditLog;
import com.workfora.audit.repository.AuditLogRepository;
import com.workfora.attendance.repository.AttendanceRecordRepository;
import com.workfora.dashboard.dto.DashboardSummaryResponse;
import com.workfora.dashboard.dto.DashboardSummaryResponse.ActivityItem;
import com.workfora.dashboard.dto.DashboardSummaryResponse.Anniversary;
import com.workfora.dashboard.dto.DashboardSummaryResponse.AttendanceToday;
import com.workfora.dashboard.dto.DashboardSummaryResponse.NamedCount;
import com.workfora.dashboard.dto.DashboardSummaryResponse.UpcomingPerson;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.leave.repository.LeaveRequestRepository;
import com.workfora.notification.repository.NotificationRepository;
import com.workfora.recruitment.repository.JobOpeningRepository;
import com.workfora.security.SecurityUtils;
import java.time.LocalDate;
import java.time.MonthDay;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final NotificationRepository notificationRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardService(
            EmployeeRepository employeeRepository,
            LeaveRequestRepository leaveRequestRepository,
            JobOpeningRepository jobOpeningRepository,
            NotificationRepository notificationRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.notificationRepository = notificationRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        var orgId = SecurityUtils.requireOrganizationId();
        LocalDate today = LocalDate.now();
        LocalDate hireCutoff = today.minusDays(30);

        long unread = SecurityUtils.currentUser()
                .map(u -> notificationRepository.countByUserIdAndReadAtIsNull(u.getId()))
                .orElse(0L);

        long inactive = employeeRepository.countByOrganizationIdAndStatus(orgId, EmployeeStatus.INACTIVE)
                + employeeRepository.countByOrganizationIdAndStatus(orgId, EmployeeStatus.TERMINATED);

        List<NamedCount> headcount = employeeRepository.countHeadcountByDepartment(orgId).stream()
                .map(row -> new NamedCount(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();

        AttendanceToday attendanceToday = new AttendanceToday(
                attendanceRecordRepository.countByWorkDateAndStatus(today, "PRESENT"),
                attendanceRecordRepository.countByWorkDateAndStatus(today, "LATE"),
                attendanceRecordRepository.countByWorkDateAndStatus(today, "ABSENT")
        );

        List<UpcomingPerson> birthdays = upcomingBirthdays(orgId, today);
        List<Anniversary> anniversaries = upcomingAnniversaries(orgId, today);

        List<ActivityItem> activities = auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10))
                .stream()
                .map(this::toActivity)
                .toList();

        return new DashboardSummaryResponse(
                employeeRepository.count(),
                employeeRepository.countByOrganizationIdAndStatus(orgId, EmployeeStatus.ACTIVE),
                inactive,
                employeeRepository.countByOrganizationIdAndHireDateGreaterThanEqual(orgId, hireCutoff),
                leaveRequestRepository.countEmployeesOnLeave(today),
                leaveRequestRepository.countByStatus("PENDING"),
                jobOpeningRepository.countByOrganizationIdAndStatus(orgId, "OPEN"),
                unread,
                attendanceToday,
                headcount,
                List.of(),
                birthdays,
                anniversaries,
                activities
        );
    }

    private List<UpcomingPerson> upcomingBirthdays(java.util.UUID orgId, LocalDate today) {
        List<UpcomingPerson> result = new ArrayList<>();
        for (Employee employee : employeeRepository.findWithDateOfBirth(orgId)) {
            LocalDate dob = employee.getDateOfBirth();
            if (dob == null) {
                continue;
            }
            MonthDay birthday = MonthDay.from(dob);
            LocalDate next = birthday.atYear(today.getYear());
            if (next.isBefore(today)) {
                next = birthday.atYear(today.getYear() + 1);
            }
            if (!next.isAfter(today.plusDays(60))) {
                result.add(new UpcomingPerson(employee.getId(), fullName(employee), next));
            }
        }
        result.sort(Comparator.comparing(UpcomingPerson::date));
        return result.stream().limit(8).toList();
    }

    private List<Anniversary> upcomingAnniversaries(java.util.UUID orgId, LocalDate today) {
        List<Anniversary> result = new ArrayList<>();
        for (Employee employee : employeeRepository.findWithHireDate(orgId)) {
            LocalDate hireDate = employee.getHireDate();
            if (hireDate == null || !hireDate.isBefore(today)) {
                continue;
            }
            MonthDay anniversary = MonthDay.from(hireDate);
            LocalDate next = anniversary.atYear(today.getYear());
            if (next.isBefore(today)) {
                next = anniversary.atYear(today.getYear() + 1);
            }
            if (!next.isAfter(today.plusDays(60))) {
                int years = next.getYear() - hireDate.getYear();
                if (years > 0) {
                    result.add(new Anniversary(employee.getId(), fullName(employee), next, years));
                }
            }
        }
        result.sort(Comparator.comparing(Anniversary::date));
        return result.stream().limit(8).toList();
    }

    private ActivityItem toActivity(AuditLog log) {
        return new ActivityItem(
                log.getId(),
                log.getAction(),
                log.getEntityType(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }

    private String fullName(Employee employee) {
        return (employee.getFirstName() + " " + employee.getLastName()).trim();
    }
}
