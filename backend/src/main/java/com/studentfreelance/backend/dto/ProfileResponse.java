package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.Role;

/**
 * Profile of the logged-in user.
 * STUDENT fields are null for EMPLOYER and vice versa.
 */
public record ProfileResponse(
    Long userId,
    String fullName,
    String email,
    Role role,

    // STUDENT
    String phone,
    String school,
    String major,
    String cvUrl,
    String introduction,

    // EMPLOYER
    String organizationName,
    String contactPhone,
    String description
) {}
