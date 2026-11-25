package com.studentfreelance.backend.dto;

// FR-12: tin tuyển dụng kèm thông tin người đăng, dùng cho trang duyệt tin của ADMIN
public record AdminJobResponse(
    JobPostResponse job,
    String employerName,
    String employerEmail,
    String organizationName
) {}
