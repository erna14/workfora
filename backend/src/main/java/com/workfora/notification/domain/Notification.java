package com.workfora.notification.domain;

import com.workfora.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 2000) private String body;
    @Column(name = "notification_type", nullable = false, length = 50) private String notificationType = "INFO";
    @Column(length = 500) private String link;
    @Column(name = "read_at") private Instant readAt;
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
