package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.ApplicationStatus;
import com.studentfreelance.backend.entity.JobStatus;
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
    LocalDateTime appliedAt,
    // FR-10: dùng để hiển thị nút "Đánh giá" khi tin đã COMPLETED
    Long employerId,
    JobStatus jobStatus,
    boolean reviewedByMe,
    // Sprint 5: thông tin liên hệ hai bên – CHỈ có khi đơn đã được chấp nhận (APPROVED),
    // các trường dưới đây là null với đơn PENDING / REJECTED.
    String studentPhone,
    String employerName,
    String employerEmail,
    String employerPhone
) {}
