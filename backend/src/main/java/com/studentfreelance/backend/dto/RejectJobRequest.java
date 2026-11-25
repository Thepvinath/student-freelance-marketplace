package com.studentfreelance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// FR-12: ADMIN từ chối tin phải ghi lý do để nhà tuyển dụng sửa lại
public record RejectJobRequest(
    @NotBlank
    @Size(max = 500)
    String reason
) {}
