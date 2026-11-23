package com.workfora.attendance.repository;

import com.workfora.attendance.domain.AttendanceCorrection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceCorrectionRepository extends JpaRepository<AttendanceCorrection, UUID> {
    List<AttendanceCorrection> findByAttendanceRecordIdOrderByCreatedAtDesc(UUID attendanceRecordId);
}
