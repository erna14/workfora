package com.workfora.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id, String title, String body, String notificationType, String link, Instant readAt, Instant createdAt
) {}
