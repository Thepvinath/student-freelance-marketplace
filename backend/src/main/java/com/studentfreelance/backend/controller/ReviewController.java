package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.ReviewRequest;
import com.studentfreelance.backend.dto.ReviewResponse;
import com.studentfreelance.backend.dto.ReviewSummaryResponse;
import com.studentfreelance.backend.service.ReviewService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// FR-10: Đánh giá hai chiều
@RestController
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping("/api/applications/{id}/reviews")
    public ResponseEntity<ReviewResponse> create(@PathVariable Long id,
                                                 @Valid @RequestBody ReviewRequest request,
                                                 Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(id, Long.valueOf(authentication.getName()), request));
    }

    // Công khai: điểm trung bình và đánh giá đã nhận của một tài khoản
    @GetMapping("/api/users/{userId}/reviews")
    public ReviewSummaryResponse summary(@PathVariable Long userId) {
        return service.summary(userId);
    }
}
