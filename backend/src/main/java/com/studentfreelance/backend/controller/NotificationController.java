package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.NotificationResponse;
import com.studentfreelance.backend.service.NotificationService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// FR-11: mỗi tài khoản chỉ xem và cập nhật thông báo của chính mình.
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotificationResponse> mine(Authentication authentication) {
        return service.mine(currentUserId(authentication));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        return service.unreadCount(currentUserId(authentication));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id, Authentication authentication) {
        return service.markRead(id, currentUserId(authentication));
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllRead(Authentication authentication) {
        return service.markAllRead(currentUserId(authentication));
    }

    private static Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
