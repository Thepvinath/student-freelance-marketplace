package com.studentfreelance.backend.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
    Long id,
    Long applicationId,
    String jobTitle,
    Long reviewerId,
    String reviewerName,
    Integer rating,
    String comment,
    LocalDateTime createdAt
) {}
