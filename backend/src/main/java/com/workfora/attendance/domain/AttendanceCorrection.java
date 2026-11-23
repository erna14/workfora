package com.workfora.attendance.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "attendance_corrections")
public class AttendanceCorrection extends BaseEntity {

    @Column(name = "attendance_record_id", nullable = false)
    private UUID attendanceRecordId;

    @Column(name = "corrected_by_user_id", nullable = false)
    private UUID correctedByUserId;

    @Column(name = "field_name", nullable = false, length = 64)
    private String fieldName;

    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", length = 500)
    private String newValue;

    @Column(nullable = false, length = 1000)
    private String reason;

    public UUID getAttendanceRecordId() { return attendanceRecordId; }
    public void setAttendanceRecordId(UUID attendanceRecordId) { this.attendanceRecordId = attendanceRecordId; }
    public UUID getCorrectedByUserId() { return correctedByUserId; }
    public void setCorrectedByUserId(UUID correctedByUserId) { this.correctedByUserId = correctedByUserId; }
    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }
    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
