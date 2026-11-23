package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.NotificationResponse;
import com.studentfreelance.backend.entity.Notification;
import com.studentfreelance.backend.repository.NotificationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

// FR-11: tạo và đọc thông báo trong ứng dụng.
// notify(...) được gọi bên trong giao dịch của ApplicationService / JobPostService,
// nên thông báo chỉ được lưu khi thao tác chính thành công.
@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void notify(Long userId, Long applicationId, String message) {
        repository.save(new Notification(userId, applicationId, message));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> mine(Long userId) {
        return repository.findTop50ByUserIdOrderByCreatedAtDescIdDesc(userId)
            .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> unreadCount(Long userId) {
        return Map.of("unread", repository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public NotificationResponse markRead(Long id, Long userId) {
        Notification notification = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setRead(true);
        return NotificationResponse.from(repository.saveAndFlush(notification));
    }

    @Transactional
    public Map<String, Integer> markAllRead(Long userId) {
        return Map.of("updated", repository.markAllRead(userId));
    }
}
