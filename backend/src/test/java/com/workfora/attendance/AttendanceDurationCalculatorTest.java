package com.workfora.attendance;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class AttendanceDurationCalculatorTest {

    @Test
    void overnightShiftProducesPositiveDuration() {
        Instant checkIn = Instant.parse("2026-03-20T22:00:00Z");
        Instant checkOut = Instant.parse("2026-03-21T06:00:00Z");

        assertThat(AttendanceDurationCalculator.grossSeconds(checkIn, checkOut)).isEqualTo(8 * 3600);
        assertThat(AttendanceDurationCalculator.netSeconds(checkIn, checkOut, 30 * 60))
                .isEqualTo(8 * 3600 - 30 * 60);
    }

    @Test
    void negativeDurationsAreClampedToZero() {
        Instant checkIn = Instant.parse("2026-03-20T10:00:00Z");
        Instant earlier = Instant.parse("2026-03-20T09:00:00Z");

        assertThat(AttendanceDurationCalculator.grossSeconds(checkIn, earlier)).isZero();
        assertThat(AttendanceDurationCalculator.netSeconds(checkIn, checkIn.plusSeconds(100), 500)).isZero();
    }
}
