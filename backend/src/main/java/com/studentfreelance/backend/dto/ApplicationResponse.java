package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.ApplicationStatus;
import java.time.LocalDateTime;

public record ApplicationResponse(
    Long id,
    Long jobId,
    String jobTitle,
    Long studentId,
    String studentName,
    String studentEmail,
    String introduction,
    String cvUrl,
    ApplicationStatus status,
    LocalDateTime appliedAt
) {}
