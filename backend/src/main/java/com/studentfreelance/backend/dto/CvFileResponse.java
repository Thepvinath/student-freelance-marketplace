package com.studentfreelance.backend.dto;

// Sprint 5: kết quả tải CV – url dùng để lưu vào hồ sơ / đơn ứng tuyển (cvUrl)
public record CvFileResponse(
    Long id,
    String fileName,
    Integer sizeBytes,
    String url
) {}
