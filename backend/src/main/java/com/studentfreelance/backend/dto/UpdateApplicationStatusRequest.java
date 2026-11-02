package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(
    @NotNull ApplicationStatus status
) {}
