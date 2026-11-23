package com.workfora.dashboard.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DashboardSummaryResponse(
        long totalEmployees,
        long activeEmployees,
        long inactiveEmployees,
        long newHires,
        long onLeave,
        long pendingLeaveRequests,
        long openJobPostings,
        long unreadNotifications,
        AttendanceToday attendanceToday,
        List<NamedCount> headcountByDepartment,
        List<NamedCount> leaveByMonth,
        List<UpcomingPerson> upcomingBirthdays,
        List<Anniversary> upcomingAnniversaries,
        List<ActivityItem> recentActivities
) {
    public record AttendanceToday(long present, long late, long absent) {}

    public record NamedCount(String name, long count) {}

    public record UpcomingPerson(UUID employeeId, String name, LocalDate date) {}

    public record Anniversary(UUID employeeId, String name, LocalDate date, int years) {}

    public record ActivityItem(
            UUID id,
            String action,
            String entityType,
            String details,
            Instant createdAt
    ) {}
}
