package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.JobPost;
import com.studentfreelance.backend.entity.JobStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record JobPostResponse(
    Long id,
    Long employerId,
    String title,
    String description,
    String industry,
    String location,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String workSchedule,
    JobStatus jobStatus,
    LocalDateTime createdAt
) {
    public static JobPostResponse from(JobPost job) {
        return new JobPostResponse(
            job.getId(),
            job.getEmployerId(),
            job.getTitle(),
            job.getDescription(),
            job.getIndustry(),
            job.getLocation(),
            job.getSalaryMin(),
            job.getSalaryMax(),
            job.getWorkSchedule(),
            job.getJobStatus(),
            job.getCreatedAt()
        );
    }
}
