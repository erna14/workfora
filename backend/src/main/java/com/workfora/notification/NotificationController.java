package com.workfora.notification;

import com.workfora.common.response.ApiResponse;
import com.workfora.common.response.PageResponse;
import com.workfora.notification.dto.NotificationResponse;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('notification:read')")
    public PageResponse<NotificationResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(notificationService.listMine(pageable));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('notification:read')")
    public ApiResponse<Map<String, Long>> unreadCount() {
        return ApiResponse.of(Map.of("count", notificationService.unreadCount()));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAuthority('notification:read')")
    public ApiResponse<NotificationResponse> markRead(@PathVariable UUID id) {
        return ApiResponse.of(notificationService.markRead(id));
    }
}
