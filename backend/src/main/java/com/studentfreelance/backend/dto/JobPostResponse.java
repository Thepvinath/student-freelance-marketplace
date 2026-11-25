package com.studentfreelance.backend.dto;

import com.studentfreelance.backend.entity.JobPost;
import com.studentfreelance.backend.entity.EmploymentType;
import com.studentfreelance.backend.entity.JobStatus;
import com.studentfreelance.backend.entity.ModerationStatus;
import com.studentfreelance.backend.entity.SalaryUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record JobPostResponse(
    Long id,
    Long employerId,
    String title,
    String description,
    String industry,
    String location,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    SalaryUnit salaryUnit,
    String workSchedule,
    LocalTime startTime,
    LocalTime endTime,
    EmploymentType employmentType,
    JobStatus jobStatus,
    // FR-12: nhà tuyển dụng thấy tin đang chờ duyệt / bị từ chối và lý do
    ModerationStatus moderationStatus,
    String moderationNote,
    LocalDateTime reviewedAt,
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
            job.getSalaryUnit(),
            job.getWorkSchedule(),
            job.getStartTime(),
            job.getEndTime(),
            job.getEmploymentType(),
            job.getJobStatus(),
            job.getModerationStatus(),
            job.getModerationNote(),
            job.getReviewedAt(),
            job.getCreatedAt()
        );
    }
}
