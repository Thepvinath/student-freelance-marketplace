package com.studentfreelance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Fields of the other role are ignored by ProfileService.
 * Empty strings are saved as NULL.
 */
public record UpdateProfileRequest(
    @NotBlank @Size(max = 150) String fullName,

    // STUDENT
    @Size(max = 20)
    @Pattern(regexp = "^$|^[0-9+()\\s.-]{8,20}$", message = "invalid phone number")
    String phone,
    @Size(max = 150) String school,
    @Size(max = 150) String major,
    @Size(max = 500) String cvUrl,
    @Size(max = 2000) String introduction,

    // EMPLOYER
    @Size(max = 200) String organizationName,
    @Size(max = 20)
    @Pattern(regexp = "^$|^[0-9+()\\s.-]{8,20}$", message = "invalid phone number")
    String contactPhone,
    @Size(max = 2000) String description
) {}
