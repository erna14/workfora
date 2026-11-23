package com.workfora.attendance.repository;

import com.workfora.attendance.domain.BreakRecord;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BreakRecordRepository extends JpaRepository<BreakRecord, UUID> {

    List<BreakRecord> findByAttendanceRecordIdOrderByStartedAtAsc(UUID attendanceRecordId);

    Optional<BreakRecord> findFirstByAttendanceRecordIdAndEndedAtIsNull(UUID attendanceRecordId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM BreakRecord b WHERE b.attendanceRecordId = :attendanceId AND b.endedAt IS NULL")
    Optional<BreakRecord> findOpenBreakForUpdate(@Param("attendanceId") UUID attendanceId);

    long countByAttendanceRecordIdAndEndedAtIsNull(UUID attendanceRecordId);
}
