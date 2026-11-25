package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.EmploymentType;
import com.studentfreelance.backend.entity.SalaryUnit;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalTime;

public record JobPostRequest(

    @NotBlank
    @Size(max = 200)
    String title,

    @NotBlank
    String description,

    @NotBlank
    @Size(max = 100)
    String industry,

    @NotBlank
    @Size(max = 200)
    String location,

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    BigDecimal salaryMin,

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    BigDecimal salaryMax,

    // Sprint 5: bắt buộc chọn HOUR (/giờ), SHIFT (/buổi) hoặc MONTH (/tháng)
    @NotNull
    SalaryUnit salaryUnit,

    @NotBlank
    @Size(max = 255)
    String workSchedule,

    // Khung giờ làm việc, dạng "HH:mm" (ví dụ "17:00"). Không bắt buộc:
    // bỏ trống cả hai = giờ linh hoạt.
    LocalTime startTime,

    LocalTime endTime,

    // Sprint 5: bắt buộc chọn PART_TIME hoặc FULL_TIME
    @NotNull
    EmploymentType employmentType

) {}
