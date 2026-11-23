package com.workfora.attendance.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_at")
    private Instant checkInAt;

    @Column(name = "check_out_at")
    private Instant checkOutAt;

    @Column(nullable = false, length = 30)
    private String status = "PRESENT";

    @Column(name = "session_state", nullable = false, length = 30)
    private String sessionState = AttendanceSessionState.WORKING.name();

    @Column(name = "total_break_seconds", nullable = false)
    private long totalBreakSeconds = 0L;

    @Column(name = "gross_work_seconds")
    private Long grossWorkSeconds;

    @Column(name = "net_work_seconds")
    private Long netWorkSeconds;

    @Column(name = "late_minutes", nullable = false)
    private int lateMinutes = 0;

    @Column(name = "overtime_minutes", nullable = false)
    private int overtimeMinutes = 0;

    @Column(name = "early_departure_minutes", nullable = false)
    private int earlyDepartureMinutes = 0;

    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "missing_checkout", nullable = false)
    private boolean missingCheckout = false;

    @Column(length = 500)
    private String notes;

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public Instant getCheckInAt() { return checkInAt; }
    public void setCheckInAt(Instant checkInAt) { this.checkInAt = checkInAt; }
    public Instant getCheckOutAt() { return checkOutAt; }
    public void setCheckOutAt(Instant checkOutAt) { this.checkOutAt = checkOutAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSessionState() { return sessionState; }
    public void setSessionState(String sessionState) { this.sessionState = sessionState; }
    public long getTotalBreakSeconds() { return totalBreakSeconds; }
    public void setTotalBreakSeconds(long totalBreakSeconds) { this.totalBreakSeconds = totalBreakSeconds; }
    public Long getGrossWorkSeconds() { return grossWorkSeconds; }
    public void setGrossWorkSeconds(Long grossWorkSeconds) { this.grossWorkSeconds = grossWorkSeconds; }
    public Long getNetWorkSeconds() { return netWorkSeconds; }
    public void setNetWorkSeconds(Long netWorkSeconds) { this.netWorkSeconds = netWorkSeconds; }
    public int getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(int lateMinutes) { this.lateMinutes = lateMinutes; }
    public int getOvertimeMinutes() { return overtimeMinutes; }
    public void setOvertimeMinutes(int overtimeMinutes) { this.overtimeMinutes = overtimeMinutes; }
    public int getEarlyDepartureMinutes() { return earlyDepartureMinutes; }
    public void setEarlyDepartureMinutes(int earlyDepartureMinutes) { this.earlyDepartureMinutes = earlyDepartureMinutes; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public boolean isMissingCheckout() { return missingCheckout; }
    public void setMissingCheckout(boolean missingCheckout) { this.missingCheckout = missingCheckout; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
