package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.Notification;
import java.time.LocalDateTime;

public record NotificationResponse(
    Long id,
    Long applicationId,
    String message,
    boolean read,
    LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
            n.getId(), n.getApplicationId(), n.getMessage(), n.isRead(), n.getCreatedAt()
        );
    }
}
