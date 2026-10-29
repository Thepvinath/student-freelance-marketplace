package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.Role;

public record LoginResponse(
    String accessToken,
    String tokenType,
    Long userId,
    String fullName,
    String email,
    Role role
) {}
