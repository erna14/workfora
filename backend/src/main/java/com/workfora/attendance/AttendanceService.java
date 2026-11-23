package com.workfora.attendance;

import com.workfora.attendance.domain.AttendanceCorrection;
import com.workfora.attendance.domain.AttendanceRecord;
import com.workfora.attendance.domain.AttendanceSessionState;
import com.workfora.attendance.domain.BreakRecord;
import com.workfora.attendance.domain.WorkSchedule;
import com.workfora.attendance.dto.AttendanceCorrectionRequest;
import com.workfora.attendance.dto.AttendanceCorrectionResponse;
import com.workfora.attendance.dto.AttendanceOverviewResponse;
import com.workfora.attendance.dto.AttendanceResponse;
import com.workfora.attendance.dto.AttendanceTodayResponse;
import com.workfora.attendance.dto.BreakResponse;
import com.workfora.attendance.repository.AttendanceCorrectionRepository;
import com.workfora.attendance.repository.AttendanceRecordRepository;
import com.workfora.attendance.repository.BreakRecordRepository;
import com.workfora.attendance.repository.WorkScheduleRepository;
import com.workfora.audit.AuditService;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.security.SecurityUtils;
import com.workfora.security.UserPrincipal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository repository;
    private final BreakRecordRepository breakRepository;
    private final AttendanceCorrectionRepository correctionRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public AttendanceService(
            AttendanceRecordRepository repository,
            BreakRecordRepository breakRepository,
            AttendanceCorrectionRepository correctionRepository,
            WorkScheduleRepository workScheduleRepository,
            EmployeeRepository employeeRepository,
            AuditService auditService
    ) {
        this.repository = repository;
        this.breakRepository = breakRepository;
        this.correctionRepository = correctionRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public AttendanceTodayResponse today() {
        UUID employeeId = requireEmployeeId();
        Instant now = Instant.now();
        AttendanceRecord active = repository.findFirstByEmployeeIdAndCheckOutAtIsNullOrderByCheckInAtDesc(employeeId)
                .orElse(null);

        WorkSchedule schedule = resolveSchedule(employeeId);
        ZoneId zone = zoneOf(schedule);
        LocalDate today = LocalDate.now(zone);

        AttendanceRecord record = active;
        if (record == null) {
            record = repository.findByEmployeeIdAndWorkDate(employeeId, today).orElse(null);
        }

        if (record == null) {
            return new AttendanceTodayResponse(
                    AttendanceSessionState.NOT_CHECKED_IN.name(),
                    now,
                    null,
                    null,
                    0,
                    0,
                    0
            );
        }

        BreakRecord openBreak = breakRepository.findFirstByAttendanceRecordIdAndEndedAtIsNull(record.getId()).orElse(null);
        String sessionState = resolveLiveSessionState(record, openBreak);
        long[] elapsed = computeElapsed(record, openBreak, now);

        return new AttendanceTodayResponse(
                sessionState,
                now,
                toResponse(record),
                openBreak == null ? null : toBreakResponse(openBreak),
                elapsed[0],
                elapsed[1],
                elapsed[2]
        );
    }

    @Transactional
    public AttendanceResponse checkIn() {
        UUID employeeId = requireEmployeeId();
        Instant now = Instant.now();
        WorkSchedule schedule = resolveSchedule(employeeId);
        ZoneId zone = zoneOf(schedule);
        LocalDate workDate = LocalDate.now(zone);

        repository.findActiveSessionForUpdate(employeeId).ifPresent(existing -> {
            throw new BusinessException("An active attendance session already exists");
        });

        if (repository.findByEmployeeIdAndWorkDate(employeeId, workDate).isPresent()) {
            throw new BusinessException("Already checked in for this work date");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployeeId(employeeId);
        record.setWorkDate(workDate);
        record.setCheckInAt(now);
        record.setSessionState(AttendanceSessionState.WORKING.name());
        record.setTimezone(zone.getId());
        record.setTotalBreakSeconds(0L);
        record.setMissingCheckout(false);

        applyLateIndicator(record, schedule, zone, now);

        try {
            AttendanceRecord saved = repository.saveAndFlush(record);
            auditService.log("ATTENDANCE_CHECK_IN", "AttendanceRecord", saved.getId(),
                    "employeeId=" + employeeId + ", workDate=" + workDate);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("An active attendance session already exists", HttpStatus.CONFLICT);
        }
    }

    @Transactional
    public AttendanceResponse checkOut() {
        UUID employeeId = requireEmployeeId();
        Instant now = Instant.now();

        AttendanceRecord record = repository.findActiveSessionForUpdate(employeeId)
                .orElseThrow(() -> new BusinessException("No active check-in session"));

        if (record.getCheckOutAt() != null) {
            throw new BusinessException("Already checked out");
        }

        WorkSchedule schedule = resolveSchedule(employeeId);
        BreakRecord openBreak = breakRepository.findOpenBreakForUpdate(record.getId()).orElse(null);

        if (openBreak != null) {
            if (!schedule.isAutoCloseBreakOnCheckout()) {
                throw new BusinessException("Cannot check out while a break is active");
            }
            closeBreak(openBreak, now, record);
        }

        record.setCheckOutAt(now);
        record.setSessionState(AttendanceSessionState.COMPLETED.name());
        record.setMissingCheckout(false);
        recalculateDurations(record, now);
        applyDepartureIndicators(record, schedule, zoneOf(schedule), now);

        AttendanceRecord saved = repository.save(record);
        auditService.log("ATTENDANCE_CHECK_OUT", "AttendanceRecord", saved.getId(),
                "netSeconds=" + saved.getNetWorkSeconds());
        return toResponse(saved);
    }

    @Transactional
    public AttendanceResponse startBreak() {
        UUID employeeId = requireEmployeeId();
        Instant now = Instant.now();

        AttendanceRecord record = repository.findActiveSessionForUpdate(employeeId)
                .orElseThrow(() -> new BusinessException("No active check-in session"));

        if (record.getCheckOutAt() != null) {
            throw new BusinessException("Cannot start a break after check-out");
        }

        if (breakRepository.findOpenBreakForUpdate(record.getId()).isPresent()) {
            throw new BusinessException("A break is already in progress");
        }

        BreakRecord br = new BreakRecord();
        br.setAttendanceRecordId(record.getId());
        br.setStartedAt(now);
        try {
            breakRepository.saveAndFlush(br);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("A break is already in progress", HttpStatus.CONFLICT);
        }

        record.setSessionState(AttendanceSessionState.ON_BREAK.name());
        AttendanceRecord saved = repository.save(record);
        auditService.log("ATTENDANCE_BREAK_START", "AttendanceRecord", saved.getId(), null);
        return toResponse(saved);
    }

    @Transactional
    public AttendanceResponse endBreak() {
        UUID employeeId = requireEmployeeId();
        Instant now = Instant.now();

        AttendanceRecord record = repository.findActiveSessionForUpdate(employeeId)
                .orElseThrow(() -> new BusinessException("No active check-in session"));

        BreakRecord openBreak = breakRepository.findOpenBreakForUpdate(record.getId())
                .orElseThrow(() -> new BusinessException("No active break to end"));

        closeBreak(openBreak, now, record);
        record.setSessionState(AttendanceSessionState.WORKING.name());
        AttendanceRecord saved = repository.save(record);
        auditService.log("ATTENDANCE_BREAK_END", "AttendanceRecord", saved.getId(),
                "totalBreakSeconds=" + saved.getTotalBreakSeconds());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> history(LocalDate from, LocalDate to, Pageable pageable) {
        UUID employeeId = requireEmployeeId();
        LocalDate start = from != null ? from : LocalDate.now(ZoneOffset.UTC).minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        return repository.findByEmployeeIdAndWorkDateBetween(employeeId, start, end, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> list(
            UUID employeeId,
            UUID departmentId,
            LocalDate from,
            LocalDate to,
            Boolean missingCheckout,
            Boolean lateOnly,
            Pageable pageable
    ) {
        AccessScope scope = resolveAccessScope();
        LocalDate start = from != null ? from : LocalDate.now(ZoneOffset.UTC).minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now(ZoneOffset.UTC);

        Collection<UUID> scopedIds = scope.employeeIds();
        boolean employeeIdsEmpty = scopedIds == null;

        if (departmentId != null) {
            List<UUID> deptIds = employeeRepository.findByDepartmentId(departmentId).stream()
                    .map(Employee::getId)
                    .toList();
            if (scopedIds == null) {
                scopedIds = deptIds;
                employeeIdsEmpty = false;
            } else {
                Set<UUID> allowed = Set.copyOf(scopedIds);
                scopedIds = deptIds.stream().filter(allowed::contains).toList();
                employeeIdsEmpty = false;
            }
        }

        if (employeeId != null) {
            assertCanViewEmployee(employeeId, scope);
        }

        return repository.searchAdmin(
                start,
                end,
                employeeId,
                scopedIds == null ? List.of() : scopedIds,
                employeeIdsEmpty,
                missingCheckout,
                Boolean.TRUE.equals(lateOnly),
                pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AttendanceOverviewResponse overview(LocalDate date) {
        AccessScope scope = resolveAccessScope();
        UUID employeeId = SecurityUtils.currentUser().map(UserPrincipal::getEmployeeId).orElse(null);
        ZoneId zone = ZoneOffset.UTC;
        if (employeeId != null) {
            zone = zoneOf(resolveSchedule(employeeId));
        }
        LocalDate day = date != null ? date : LocalDate.now(zone);

        Page<AttendanceRecord> page = repository.searchAdmin(
                day,
                day,
                null,
                scope.employeeIds() == null ? List.of() : scope.employeeIds(),
                scope.employeeIds() == null,
                null,
                false,
                Pageable.unpaged()
        );

        long working = 0;
        long onBreak = 0;
        long completed = 0;
        long missing = 0;
        long late = 0;
        for (AttendanceRecord r : page.getContent()) {
            BreakRecord open = breakRepository.findFirstByAttendanceRecordIdAndEndedAtIsNull(r.getId()).orElse(null);
            String state = resolveLiveSessionState(r, open);
            if (AttendanceSessionState.WORKING.name().equals(state)) working++;
            if (AttendanceSessionState.ON_BREAK.name().equals(state)) onBreak++;
            if (AttendanceSessionState.COMPLETED.name().equals(state)) completed++;
            if (r.isMissingCheckout()) missing++;
            if (r.getLateMinutes() > 0) late++;
        }

        return new AttendanceOverviewResponse(
                day,
                working + onBreak + completed,
                working,
                onBreak,
                completed,
                missing,
                late
        );
    }

    @Transactional(readOnly = true)
    public AttendanceResponse get(UUID id) {
        AttendanceRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        assertCanViewEmployee(record.getEmployeeId(), resolveAccessScope());
        return toResponse(record);
    }

    @Transactional
    public AttendanceResponse correct(UUID id, AttendanceCorrectionRequest request) {
        requireHrAdmin();
        AttendanceRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        UUID actorId = SecurityUtils.requireUserId();
        List<AttendanceCorrection> corrections = new ArrayList<>();

        if (request.checkInAt() != null && !Objects.equals(request.checkInAt(), record.getCheckInAt())) {
            corrections.add(buildCorrection(record.getId(), actorId, "checkInAt",
                    stringify(record.getCheckInAt()), stringify(request.checkInAt()), request.reason()));
            record.setCheckInAt(request.checkInAt());
        }
        if (request.checkOutAt() != null && !Objects.equals(request.checkOutAt(), record.getCheckOutAt())) {
            corrections.add(buildCorrection(record.getId(), actorId, "checkOutAt",
                    stringify(record.getCheckOutAt()), stringify(request.checkOutAt()), request.reason()));
            record.setCheckOutAt(request.checkOutAt());
        }
        if (request.status() != null && !request.status().isBlank() && !request.status().equals(record.getStatus())) {
            corrections.add(buildCorrection(record.getId(), actorId, "status",
                    record.getStatus(), request.status(), request.reason()));
            record.setStatus(request.status());
        }
        if (request.notes() != null && !Objects.equals(request.notes(), record.getNotes())) {
            corrections.add(buildCorrection(record.getId(), actorId, "notes",
                    record.getNotes(), request.notes(), request.reason()));
            record.setNotes(request.notes());
        }

        if (corrections.isEmpty()) {
            throw new BusinessException("No attendance fields changed");
        }

        if (record.getCheckInAt() != null && record.getCheckOutAt() != null) {
            if (record.getCheckOutAt().isBefore(record.getCheckInAt())) {
                throw new BusinessException("Check-out cannot be before check-in");
            }
            recalculateDurations(record, record.getCheckOutAt());
            record.setSessionState(AttendanceSessionState.COMPLETED.name());
            record.setMissingCheckout(false);
        } else if (record.getCheckInAt() != null) {
            record.setSessionState(AttendanceSessionState.WORKING.name());
            record.setGrossWorkSeconds(null);
            record.setNetWorkSeconds(null);
        }

        correctionRepository.saveAll(corrections);
        AttendanceRecord saved = repository.save(record);
        auditService.log("ATTENDANCE_CORRECTION", "AttendanceRecord", saved.getId(), request.reason());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AttendanceCorrectionResponse> corrections(UUID attendanceId) {
        AttendanceRecord record = repository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        assertCanViewEmployee(record.getEmployeeId(), resolveAccessScope());
        return correctionRepository.findByAttendanceRecordIdOrderByCreatedAtDesc(attendanceId).stream()
                .map(c -> new AttendanceCorrectionResponse(
                        c.getId(),
                        c.getAttendanceRecordId(),
                        c.getCorrectedByUserId(),
                        c.getFieldName(),
                        c.getOldValue(),
                        c.getNewValue(),
                        c.getReason(),
                        c.getCreatedAt()
                ))
                .toList();
    }

    private void closeBreak(BreakRecord openBreak, Instant now, AttendanceRecord record) {
        if (now.isBefore(openBreak.getStartedAt())) {
            throw new BusinessException("Invalid break end time");
        }
        long duration = Math.max(0, Duration.between(openBreak.getStartedAt(), now).getSeconds());
        openBreak.setEndedAt(now);
        openBreak.setDurationSeconds(duration);
        breakRepository.save(openBreak);
        record.setTotalBreakSeconds(Math.max(0, record.getTotalBreakSeconds() + duration));
    }

    private void recalculateDurations(AttendanceRecord record, Instant end) {
        if (record.getCheckInAt() == null) {
            record.setGrossWorkSeconds(0L);
            record.setNetWorkSeconds(0L);
            return;
        }
        long gross = AttendanceDurationCalculator.grossSeconds(record.getCheckInAt(), end);
        long net = AttendanceDurationCalculator.netSeconds(
                record.getCheckInAt(), end, record.getTotalBreakSeconds());
        record.setGrossWorkSeconds(gross);
        record.setNetWorkSeconds(net);
    }

    private void applyLateIndicator(AttendanceRecord record, WorkSchedule schedule, ZoneId zone, Instant checkInAt) {
        LocalDateTime expectedStart = LocalDateTime.of(record.getWorkDate(), schedule.getExpectedStartTime());
        Instant expected = expectedStart.atZone(zone).toInstant()
                .plus(Duration.ofMinutes(schedule.getLateGraceMinutes()));
        if (checkInAt.isAfter(expected)) {
            long late = Duration.between(expected, checkInAt).toMinutes();
            record.setLateMinutes((int) Math.max(0, late));
            record.setStatus("LATE");
        } else {
            record.setLateMinutes(0);
            record.setStatus("PRESENT");
        }
    }

    private void applyDepartureIndicators(AttendanceRecord record, WorkSchedule schedule, ZoneId zone, Instant checkOutAt) {
        LocalDateTime expectedEnd = LocalDateTime.of(record.getWorkDate(), schedule.getExpectedEndTime());
        // Overnight: if end time is before start, end is next day
        if (!schedule.getExpectedEndTime().isAfter(schedule.getExpectedStartTime())) {
            expectedEnd = expectedEnd.plusDays(1);
        }
        Instant expected = expectedEnd.atZone(zone).toInstant();
        if (checkOutAt.isBefore(expected)) {
            record.setEarlyDepartureMinutes((int) Math.max(0, Duration.between(checkOutAt, expected).toMinutes()));
            if (!"LATE".equals(record.getStatus())) {
                record.setStatus("EARLY_DEPARTURE");
            }
        } else {
            record.setEarlyDepartureMinutes(0);
            record.setOvertimeMinutes((int) Math.max(0, Duration.between(expected, checkOutAt).toMinutes()));
            if (record.getOvertimeMinutes() > 0 && !"LATE".equals(record.getStatus())) {
                record.setStatus("OVERTIME");
            }
        }
    }

    private long[] computeElapsed(AttendanceRecord record, BreakRecord openBreak, Instant now) {
        if (record.getCheckInAt() == null) {
            return new long[]{0, 0, 0};
        }
        Instant end = record.getCheckOutAt() != null ? record.getCheckOutAt() : now;
        long gross = Math.max(0, Duration.between(record.getCheckInAt(), end).getSeconds());
        long breaks = Math.max(0, record.getTotalBreakSeconds());
        if (openBreak != null && record.getCheckOutAt() == null) {
            breaks += Math.max(0, Duration.between(openBreak.getStartedAt(), now).getSeconds());
        }
        long net = Math.max(0, gross - breaks);
        return new long[]{gross, breaks, net};
    }

    private String resolveLiveSessionState(AttendanceRecord record, BreakRecord openBreak) {
        if (record.getCheckOutAt() != null) {
            return AttendanceSessionState.COMPLETED.name();
        }
        if (record.getCheckInAt() == null) {
            return AttendanceSessionState.NOT_CHECKED_IN.name();
        }
        if (openBreak != null) {
            return AttendanceSessionState.ON_BREAK.name();
        }
        return AttendanceSessionState.WORKING.name();
    }

    private WorkSchedule resolveSchedule(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return workScheduleRepository.findFirstByOrganizationIdAndIsDefaultTrue(employee.getOrganizationId())
                .orElseGet(this::defaultSchedule);
    }

    private WorkSchedule defaultSchedule() {
        WorkSchedule schedule = new WorkSchedule();
        schedule.setTimezone("UTC");
        schedule.setExpectedStartTime(LocalTime.of(9, 0));
        schedule.setExpectedEndTime(LocalTime.of(17, 0));
        schedule.setLateGraceMinutes(5);
        schedule.setAutoCloseBreakOnCheckout(true);
        return schedule;
    }

    private ZoneId zoneOf(WorkSchedule schedule) {
        try {
            return ZoneId.of(schedule.getTimezone());
        } catch (Exception ex) {
            return ZoneOffset.UTC;
        }
    }

    private UUID requireEmployeeId() {
        return SecurityUtils.currentUser()
                .map(UserPrincipal::getEmployeeId)
                .orElseThrow(() -> new BusinessException("Current user has no linked employee"));
    }

    private void requireHrAdmin() {
        UserPrincipal user = SecurityUtils.currentUser()
                .orElseThrow(() -> new BusinessException("Unauthenticated", HttpStatus.UNAUTHORIZED));
        Set<String> authorities = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        if (!(authorities.contains("ROLE_SUPER_ADMIN")
                || authorities.contains("ROLE_HR_ADMIN")
                || authorities.contains("ROLE_HR_OFFICER"))) {
            throw new BusinessException("Insufficient permissions to correct attendance", HttpStatus.FORBIDDEN);
        }
    }

    private AccessScope resolveAccessScope() {
        UserPrincipal user = SecurityUtils.currentUser()
                .orElseThrow(() -> new BusinessException("Unauthenticated", HttpStatus.UNAUTHORIZED));
        Set<String> authorities = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        if (authorities.contains("ROLE_SUPER_ADMIN")
                || authorities.contains("ROLE_HR_ADMIN")
                || authorities.contains("ROLE_HR_OFFICER")) {
            return new AccessScope(null);
        }

        UUID self = user.getEmployeeId();
        if (authorities.contains("ROLE_DEPT_MANAGER") && self != null) {
            List<UUID> team = new ArrayList<>();
            team.add(self);
            employeeRepository.findByManagerId(self).forEach(e -> team.add(e.getId()));
            return new AccessScope(team);
        }

        if (self == null) {
            throw new BusinessException("Current user has no linked employee", HttpStatus.FORBIDDEN);
        }
        return new AccessScope(List.of(self));
    }

    private void assertCanViewEmployee(UUID employeeId, AccessScope scope) {
        if (scope.employeeIds() == null) {
            return;
        }
        if (!scope.employeeIds().contains(employeeId)) {
            throw new BusinessException("Not authorized to view this attendance record", HttpStatus.FORBIDDEN);
        }
    }

    private AttendanceCorrection buildCorrection(
            UUID attendanceId, UUID actorId, String field, String oldValue, String newValue, String reason
    ) {
        AttendanceCorrection c = new AttendanceCorrection();
        c.setAttendanceRecordId(attendanceId);
        c.setCorrectedByUserId(actorId);
        c.setFieldName(field);
        c.setOldValue(oldValue);
        c.setNewValue(newValue);
        c.setReason(reason);
        return c;
    }

    private String stringify(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private AttendanceResponse toResponse(AttendanceRecord r) {
        List<BreakResponse> breaks = breakRepository.findByAttendanceRecordIdOrderByStartedAtAsc(r.getId()).stream()
                .map(this::toBreakResponse)
                .toList();

        String employeeName = employeeRepository.findById(r.getEmployeeId())
                .map(e -> e.getFirstName() + " " + e.getLastName())
                .orElse(null);

        BreakRecord open = breakRepository.findFirstByAttendanceRecordIdAndEndedAtIsNull(r.getId()).orElse(null);
        String sessionState = resolveLiveSessionState(r, open);

        return new AttendanceResponse(
                r.getId(),
                r.getEmployeeId(),
                employeeName,
                r.getWorkDate(),
                r.getCheckInAt(),
                r.getCheckOutAt(),
                r.getStatus(),
                sessionState,
                r.getTotalBreakSeconds(),
                r.getGrossWorkSeconds(),
                r.getNetWorkSeconds(),
                r.getLateMinutes(),
                r.getOvertimeMinutes(),
                r.getEarlyDepartureMinutes(),
                r.getLateMinutes() > 0,
                r.getOvertimeMinutes() > 0,
                r.getEarlyDepartureMinutes() > 0,
                r.isMissingCheckout(),
                r.getTimezone(),
                r.getNotes(),
                breaks
        );
    }

    private BreakResponse toBreakResponse(BreakRecord b) {
        return new BreakResponse(b.getId(), b.getAttendanceRecordId(), b.getStartedAt(), b.getEndedAt(), b.getDurationSeconds());
    }

    private record AccessScope(Collection<UUID> employeeIds) {}
}
