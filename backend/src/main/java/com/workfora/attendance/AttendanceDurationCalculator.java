package com.workfora.attendance;

import java.time.Duration;
import java.time.Instant;

final class AttendanceDurationCalculator {

    private AttendanceDurationCalculator() {
    }

    static long grossSeconds(Instant checkInAt, Instant checkOutAt) {
        if (checkInAt == null || checkOutAt == null) {
            return 0L;
        }
        return Math.max(0, Duration.between(checkInAt, checkOutAt).getSeconds());
    }

    static long netSeconds(Instant checkInAt, Instant checkOutAt, long totalBreakSeconds) {
        long gross = grossSeconds(checkInAt, checkOutAt);
        return Math.max(0, gross - Math.max(0, totalBreakSeconds));
    }
}
