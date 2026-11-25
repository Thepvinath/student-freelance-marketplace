package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.AdminJobResponse;
import com.studentfreelance.backend.dto.RejectJobRequest;
import com.studentfreelance.backend.entity.ModerationStatus;
import com.studentfreelance.backend.service.JobModerationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

// FR-12: chỉ ADMIN (xem SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    private final JobModerationService service;

    public AdminJobController(JobModerationService service) {
        this.service = service;
    }

    // ?status=PENDING (mặc định) | APPROVED | REJECTED | ALL
    @GetMapping
    public List<AdminJobResponse> list(
            @RequestParam(defaultValue = "PENDING") String status) {
        return service.list(parseStatus(status));
    }

    @GetMapping("/counts")
    public Map<String, Long> counts() {
        return service.counts();
    }

    @PatchMapping("/{id}/approve")
    public AdminJobResponse approve(@PathVariable Long id, Authentication authentication) {
        return service.approve(id, currentUserId(authentication));
    }

    @PatchMapping("/{id}/reject")
    public AdminJobResponse reject(@PathVariable Long id,
                                   @Valid @RequestBody RejectJobRequest request,
                                   Authentication authentication) {
        return service.reject(id, currentUserId(authentication), request);
    }

    private static ModerationStatus parseStatus(String value) {
        if ("ALL".equalsIgnoreCase(value)) return null;
        try {
            return ModerationStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "status must be PENDING, APPROVED, REJECTED or ALL");
        }
    }

    private Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
