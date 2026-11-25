package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.AdminJobResponse;
import com.studentfreelance.backend.dto.JobPostResponse;
import com.studentfreelance.backend.dto.RejectJobRequest;
import com.studentfreelance.backend.entity.EmployerProfile;
import com.studentfreelance.backend.entity.JobPost;
import com.studentfreelance.backend.entity.ModerationStatus;
import com.studentfreelance.backend.entity.User;
import com.studentfreelance.backend.repository.EmployerProfileRepository;
import com.studentfreelance.backend.repository.JobPostRepository;
import com.studentfreelance.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// FR-12: Quản trị viên duyệt tin tuyển dụng trước khi hiển thị cho sinh viên.
// Luồng: PENDING → APPROVED (hiện trên trang chủ) hoặc PENDING → REJECTED (kèm lý do).
// Nhà tuyển dụng sửa tin → tin quay lại PENDING (xem JobPostService.update).
@Service
public class JobModerationService {

    private final JobPostRepository jobs;
    private final UserRepository users;
    private final EmployerProfileRepository employerProfiles;
    private final NotificationService notifications;

    public JobModerationService(JobPostRepository jobs,
                                UserRepository users,
                                EmployerProfileRepository employerProfiles,
                                NotificationService notifications) {
        this.jobs = jobs;
        this.users = users;
        this.employerProfiles = employerProfiles;
        this.notifications = notifications;
    }

    // status = null → tất cả tin (mới nhất trước); PENDING → hàng đợi (cũ nhất trước)
    @Transactional(readOnly = true)
    public List<AdminJobResponse> list(ModerationStatus status) {
        List<JobPost> list = status == null
            ? jobs.findAllByOrderByCreatedAtDesc()
            : jobs.findByModerationStatusOrderByCreatedAtAsc(status);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> counts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (ModerationStatus status : ModerationStatus.values()) {
            counts.put(status.name(), jobs.countByModerationStatus(status));
        }
        return counts;
    }

    @Transactional
    public AdminJobResponse approve(Long jobId, Long adminId) {
        JobPost job = requirePending(jobId);
        job.setModerationStatus(ModerationStatus.APPROVED);
        job.setModerationNote(null);
        job.setReviewedBy(adminId);
        job.setReviewedAt(LocalDateTime.now());
        JobPost saved = jobs.saveAndFlush(job);

        notifications.notify(saved.getEmployerId(), null,
            "Tin “" + saved.getTitle() + "” đã được duyệt và đang hiển thị cho sinh viên.");
        return toResponse(saved);
    }

    @Transactional
    public AdminJobResponse reject(Long jobId, Long adminId, RejectJobRequest request) {
        JobPost job = requirePending(jobId);
        String reason = request.reason().trim();
        if (reason.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
        }
        job.setModerationStatus(ModerationStatus.REJECTED);
        job.setModerationNote(reason);
        job.setReviewedBy(adminId);
        job.setReviewedAt(LocalDateTime.now());
        JobPost saved = jobs.saveAndFlush(job);

        notifications.notify(saved.getEmployerId(), null,
            "Tin “" + saved.getTitle() + "” chưa được duyệt. Lý do: " + reason);
        return toResponse(saved);
    }

    private JobPost requirePending(Long jobId) {
        JobPost job = jobs.findById(jobId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        if (job.getModerationStatus() != ModerationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not waiting for review");
        }
        return job;
    }

    private AdminJobResponse toResponse(JobPost job) {
        User employer = users.findById(job.getEmployerId()).orElse(null);
        String organization = employerProfiles.findById(job.getEmployerId())
            .map(EmployerProfile::getOrganizationName)
            .orElse(null);
        return new AdminJobResponse(
            JobPostResponse.from(job),
            employer == null ? null : employer.getFullName(),
            employer == null ? null : employer.getEmail(),
            organization
        );
    }
}
