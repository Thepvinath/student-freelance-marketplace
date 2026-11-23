package com.studentfreelance.backend.dto;

import java.util.List;

// Điểm trung bình (làm tròn 1 chữ số) và các đánh giá đã nhận của một tài khoản.
public record ReviewSummaryResponse(
    Long userId,
    double average,
    int count,
    List<ReviewResponse> reviews
) {}
