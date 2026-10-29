package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.Role;

public record RegisterResponse(
    Long id,
    String fullName,
    String email,
    Role role
) {}
