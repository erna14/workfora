package com.workfora.attendance.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "work_schedules")
public class WorkSchedule extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "expected_start_time", nullable = false)
    private LocalTime expectedStartTime;

    @Column(name = "expected_end_time", nullable = false)
    private LocalTime expectedEndTime;

    @Column(name = "late_grace_minutes", nullable = false)
    private int lateGraceMinutes = 5;

    @Column(name = "auto_close_break_on_checkout", nullable = false)
    private boolean autoCloseBreakOnCheckout = true;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public LocalTime getExpectedStartTime() { return expectedStartTime; }
    public void setExpectedStartTime(LocalTime expectedStartTime) { this.expectedStartTime = expectedStartTime; }
    public LocalTime getExpectedEndTime() { return expectedEndTime; }
    public void setExpectedEndTime(LocalTime expectedEndTime) { this.expectedEndTime = expectedEndTime; }
    public int getLateGraceMinutes() { return lateGraceMinutes; }
    public void setLateGraceMinutes(int lateGraceMinutes) { this.lateGraceMinutes = lateGraceMinutes; }
    public boolean isAutoCloseBreakOnCheckout() { return autoCloseBreakOnCheckout; }
    public void setAutoCloseBreakOnCheckout(boolean autoCloseBreakOnCheckout) {
        this.autoCloseBreakOnCheckout = autoCloseBreakOnCheckout;
    }
    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }
}
