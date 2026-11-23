package com.workfora.attendance.repository;

import com.workfora.attendance.domain.AttendanceRecord;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AttendanceRecord a WHERE a.employeeId = :employeeId AND a.checkOutAt IS NULL")
    Optional<AttendanceRecord> findActiveSessionForUpdate(@Param("employeeId") UUID employeeId);

    Optional<AttendanceRecord> findFirstByEmployeeIdAndCheckOutAtIsNullOrderByCheckInAtDesc(UUID employeeId);

    Page<AttendanceRecord> findByEmployeeId(UUID employeeId, Pageable pageable);

    Page<AttendanceRecord> findByEmployeeIdAndWorkDateBetween(
            UUID employeeId, LocalDate from, LocalDate to, Pageable pageable);

    Page<AttendanceRecord> findByWorkDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    Page<AttendanceRecord> findByEmployeeIdInAndWorkDateBetween(
            Collection<UUID> employeeIds, LocalDate from, LocalDate to, Pageable pageable);

    long countByWorkDateAndStatus(LocalDate workDate, String status);

    long countByWorkDateAndMissingCheckoutTrue(LocalDate workDate);

    long countByWorkDateAndLateMinutesGreaterThan(LocalDate workDate, int minutes);

    @Query("""
            SELECT a FROM AttendanceRecord a
            WHERE a.workDate BETWEEN :from AND :to
              AND (:employeeId IS NULL OR a.employeeId = :employeeId)
              AND (:missingCheckout IS NULL OR a.missingCheckout = :missingCheckout)
              AND (:lateOnly = FALSE OR a.lateMinutes > 0)
              AND (:employeeIdsEmpty = TRUE OR a.employeeId IN :employeeIds)
            """)
    Page<AttendanceRecord> searchAdmin(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("employeeId") UUID employeeId,
            @Param("employeeIds") Collection<UUID> employeeIds,
            @Param("employeeIdsEmpty") boolean employeeIdsEmpty,
            @Param("missingCheckout") Boolean missingCheckout,
            @Param("lateOnly") boolean lateOnly,
            Pageable pageable
    );

    List<AttendanceRecord> findByEmployeeIdAndWorkDateBetweenOrderByWorkDateDesc(
            UUID employeeId, LocalDate from, LocalDate to);
}
