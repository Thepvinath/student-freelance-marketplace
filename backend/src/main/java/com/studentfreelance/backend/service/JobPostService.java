package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.ApplicationRepository;
import com.studentfreelance.backend.repository.JobPostRepository;
import com.studentfreelance.backend.repository.UserRepository;

import jakarta.persistence.EntityManager;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class JobPostService {

    private final JobPostRepository repository;
    private final ApplicationRepository applications;
    private final EntityManager entityManager;
    private final NotificationService notifications;
    private final UserRepository users;

    public JobPostService(
            JobPostRepository repository,
            ApplicationRepository applications,
            EntityManager entityManager,
            NotificationService notifications,
            UserRepository users) {
        this.repository = repository;
        this.applications = applications;
        this.entityManager = entityManager;
        this.notifications = notifications;
        this.users = users;
    }

    // Public: list only OPEN jobs that an ADMIN has approved (FR-12)
    @Transactional(readOnly = true)
    public List<JobPostResponse> getOpenJobs() {
        return repository
            .findByJobStatusAndModerationStatusOrderByCreatedAtDesc(
                JobStatus.OPEN, ModerationStatus.APPROVED)
            .stream()
            .map(JobPostResponse::from)
            .toList();
    }

    // Public: view an OPEN, approved job
    @Transactional(readOnly = true)
    public JobPostResponse getJob(Long id) {
        JobPost job = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            ));

        if (job.getJobStatus() != JobStatus.OPEN
                || job.getModerationStatus() != ModerationStatus.APPROVED) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            );
        }

        return JobPostResponse.from(job);
    }

    // Employer: view own jobs
    @Transactional(readOnly = true)
    public List<JobPostResponse> getMyJobs(Long employerId) {
        return repository
            .findByEmployerIdOrderByCreatedAtDesc(employerId)
            .stream()
            .map(JobPostResponse::from)
            .toList();
    }

    // Employer: create job. FR-12: the job waits for ADMIN approval
    // (PENDING) and is not shown to students until it is APPROVED.
    @Transactional
    public JobPostResponse create(
            JobPostRequest request,
            Long employerId) {

        validateSalary(request);
        validateWorkTime(request);

        JobPost job = new JobPost();
        job.setEmployerId(employerId);
        job.setJobStatus(JobStatus.OPEN);
        job.setModerationStatus(ModerationStatus.PENDING);

        applyRequest(job, request);

        JobPost saved = repository.saveAndFlush(job);

        // Reload database-generated created_at
        entityManager.refresh(saved);

        notifyAdmins("Tin mới \u201C" + saved.getTitle() + "\u201D đang chờ duyệt.");

        return JobPostResponse.from(saved);
    }

    // Employer: update own OPEN job.
    // FR-12: edited content must be approved again before it is shown.
    @Transactional
    public JobPostResponse update(
            Long id,
            Long employerId,
            JobPostRequest request) {

        JobPost job = findOwnedJob(id, employerId);

        if (job.getJobStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only OPEN jobs can be edited"
            );
        }

        validateSalary(request);
        validateWorkTime(request);
        applyRequest(job, request);

        job.setModerationStatus(ModerationStatus.PENDING);
        job.setModerationNote(null);
        job.setReviewedBy(null);
        job.setReviewedAt(null);

        JobPost saved = repository.saveAndFlush(job);
        notifyAdmins("Tin \u201C" + saved.getTitle() + "\u201D vừa được chỉnh sửa, cần duyệt lại.");

        return JobPostResponse.from(saved);
    }

    // Employer: mark own OPEN job as FILLED
    @Transactional
    public JobPostResponse markFilled(
            Long id, Long employerId) {

        JobPost job = findOwnedJob(id, employerId);

        if (job.getJobStatus() != JobStatus.OPEN
                || job.getModerationStatus() != ModerationStatus.APPROVED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Job is not OPEN and approved"
            );
        }

        job.setJobStatus(JobStatus.FILLED);

        // FR-11: báo cho sinh viên còn chờ xét duyệt rằng tin đã đủ người
        for (JobApplication pending : applications.findByJobIdAndStatus(
                id, ApplicationStatus.PENDING)) {
            notifications.notify(pending.getStudentId(), pending.getId(),
                "Tin \u201C" + job.getTitle() + "\u201D đã đủ người.");
        }

        return JobPostResponse.from(
            repository.saveAndFlush(job)
        );
    }

    // FR-09: Employer marks own FILLED job as COMPLETED.
    // Flow: OPEN -> FILLED -> COMPLETED. Requires at least one
    // APPROVED application (needed later for reviews, FR-10).
    @Transactional
    public JobPostResponse markCompleted(
            Long id, Long employerId) {

        JobPost job = findOwnedJob(id, employerId);

        if (job.getJobStatus() != JobStatus.FILLED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only FILLED jobs can be completed"
            );
        }

        if (!applications.existsByJobIdAndStatus(
                id, ApplicationStatus.APPROVED)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Job has no APPROVED application"
            );
        }

        job.setJobStatus(JobStatus.COMPLETED);

        // FR-11: báo cho sinh viên đã được nhận rằng công việc hoàn thành
        for (JobApplication approved : applications.findByJobIdAndStatus(
                id, ApplicationStatus.APPROVED)) {
            notifications.notify(approved.getStudentId(), approved.getId(),
                "Công việc \u201C" + job.getTitle() + "\u201D đã hoàn thành. Bạn có thể đánh giá nhà tuyển dụng.");
        }

        return JobPostResponse.from(
            repository.saveAndFlush(job)
        );
    }

    // FR-12: báo cho mọi tài khoản ADMIN (không gắn với đơn ứng tuyển nào)
    private void notifyAdmins(String message) {
        for (User admin : users.findByRole(Role.ADMIN)) {
            notifications.notify(admin.getId(), null, message);
        }
    }

    private JobPost findOwnedJob(Long id, Long employerId) {
        return repository
            .findByIdAndEmployerId(id, employerId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            ));
    }

    private void validateSalary(JobPostRequest request) {
        if (request.salaryMin().compareTo(
                request.salaryMax()) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "salaryMin cannot exceed salaryMax"
            );
        }
    }

    // Sprint 4: giờ bắt đầu / kết thúc phải cùng có hoặc cùng trống,
    // và giờ kết thúc phải sau giờ bắt đầu (chưa hỗ trợ ca qua nửa đêm).
    private void validateWorkTime(JobPostRequest request) {
        if ((request.startTime() == null) != (request.endTime() == null)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "startTime and endTime must be provided together"
            );
        }
        if (request.startTime() != null
                && !request.endTime().isAfter(request.startTime())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "endTime must be after startTime"
            );
        }
    }

    private void applyRequest(
            JobPost job, JobPostRequest request) {

        job.setTitle(request.title().trim());
        job.setDescription(request.description().trim());
        job.setIndustry(request.industry().trim());
        job.setLocation(request.location().trim());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setSalaryUnit(request.salaryUnit());
        job.setWorkSchedule(request.workSchedule().trim());
        job.setStartTime(request.startTime());
        job.setEndTime(request.endTime());
        job.setEmploymentType(request.employmentType());
    }
}
