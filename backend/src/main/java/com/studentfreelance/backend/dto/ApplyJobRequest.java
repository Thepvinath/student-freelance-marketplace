package com.studentfreelance.backend.dto;

import jakarta.validation.constraints.Size;

public record ApplyJobRequest(
    @Size(max = 2000) String introduction,
    @Size(max = 500) String cvUrl
) {}
