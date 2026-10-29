package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.Role;
import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank
    @Size(max = 150)
    String fullName,

    @NotBlank
    @Email
    String email,

    @NotBlank
    @Size(min = 8, max = 72)
    String password,

    @NotNull
    Role role
) {}
