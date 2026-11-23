package com.workfora.notification;

import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.notification.domain.Notification;
import com.workfora.notification.dto.NotificationResponse;
import com.workfora.notification.repository.NotificationRepository;
import com.workfora.security.SecurityUtils;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> listMine(Pageable pageable) {
        UUID userId = SecurityUtils.requireUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notificationRepository.countByUserIdAndReadAtIsNull(SecurityUtils.requireUserId());
    }

    @Transactional
    public NotificationResponse markRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(SecurityUtils.requireUserId())) {
            throw new ResourceNotFoundException("Notification not found");
        }
        notification.setReadAt(Instant.now());
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationResponse create(UUID userId, String title, String body, String type, String link) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setNotificationType(type != null ? type : "INFO");
        notification.setLink(link);
        return toResponse(notificationRepository.save(notification));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getBody(), n.getNotificationType(), n.getLink(), n.getReadAt(), n.getCreatedAt());
    }
}
