package com.studentfreelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// FR-11: Thông báo trong ứng dụng khi trạng thái đơn / công việc thay đổi.
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Có thể NULL (FK ON DELETE SET NULL)
    @Column(name = "application_id")
    private Long applicationId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Notification() {}

    public Notification(Long userId, Long applicationId, String message) {
        this.userId = userId;
        this.applicationId = applicationId;
        this.message = message;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getApplicationId() { return applicationId; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
