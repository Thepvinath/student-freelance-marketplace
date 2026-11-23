package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.ReviewRequest;
import com.studentfreelance.backend.dto.ReviewResponse;
import com.studentfreelance.backend.dto.ReviewSummaryResponse;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.*;

import jakarta.persistence.EntityManager;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// FR-10: Đánh giá hai chiều sau khi hoàn thành công việc.
// Quy tắc:
//  - Chỉ đánh giá khi tin đã COMPLETED và đơn ứng tuyển đã APPROVED.
//  - Sinh viên của đơn đánh giá nhà tuyển dụng; nhà tuyển dụng (chủ tin) đánh giá sinh viên.
//  - Mỗi người chỉ đánh giá một lần cho mỗi đơn (409 nếu đánh giá lại).
//  - Người không liên quan đến đơn nhận 404 (không tiết lộ đơn có tồn tại hay không).
@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final ApplicationRepository applications;
    private final JobPostRepository jobs;
    private final UserRepository users;
    private final EmployerProfileRepository employerProfiles;
    private final NotificationService notifications;
    private final EntityManager entityManager;

    public ReviewService(ReviewRepository reviews,
                         ApplicationRepository applications,
                         JobPostRepository jobs,
                         UserRepository users,
                         EmployerProfileRepository employerProfiles,
                         NotificationService notifications,
                         EntityManager entityManager) {
        this.reviews = reviews;
        this.applications = applications;
        this.jobs = jobs;
        this.users = users;
        this.employerProfiles = employerProfiles;
        this.notifications = notifications;
        this.entityManager = entityManager;
    }

    @Transactional
    public ReviewResponse create(Long applicationId, Long reviewerId, ReviewRequest request) {
        JobApplication application = applications.findById(applicationId)
            .orElseThrow(() -> notFound());
        JobPost job = jobs.findById(application.getJobId())
            .orElseThrow(() -> notFound());

        Long revieweeId;
        if (reviewerId.equals(application.getStudentId())) {
            revieweeId = job.getEmployerId();
        } else if (reviewerId.equals(job.getEmployerId())) {
            revieweeId = application.getStudentId();
        } else {
            throw notFound();
        }

        if (job.getJobStatus() != JobStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is not completed yet");
        }
        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only APPROVED applications can be reviewed");
        }
        if (reviews.existsByApplicationIdAndReviewerId(applicationId, reviewerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this application");
        }

        String comment = request.comment() == null || request.comment().isBlank()
            ? null : request.comment().trim();

        Review saved;
        try {
            saved = reviews.saveAndFlush(
                new Review(applicationId, reviewerId, revieweeId, request.rating(), comment));
            entityManager.refresh(saved); // lấy created_at mặc định của MySQL
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "You already reviewed this application", exception);
        }

        // FR-11: báo cho người được đánh giá
        notifications.notify(revieweeId, applicationId,
            displayName(reviewerId) + " đã đánh giá bạn " + request.rating()
                + " sao cho công việc “" + job.getTitle() + "”.");

        return toResponse(saved, job);
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse summary(Long userId) {
        if (!users.existsById(userId)) {
            throw notFound();
        }
        List<ReviewResponse> received = reviews.findByRevieweeIdOrderByCreatedAtDescIdDesc(userId)
            .stream()
            .map(review -> toResponse(review, jobOf(review)))
            .toList();
        double average = received.stream().mapToInt(ReviewResponse::rating).average().orElse(0);
        return new ReviewSummaryResponse(userId, Math.round(average * 10) / 10.0, received.size(), received);
    }

    // Đơn nào trong danh sách đã được reviewerId đánh giá (để giao diện ẩn nút "Đánh giá").
    @Transactional(readOnly = true)
    public Set<Long> reviewedApplicationIds(Long reviewerId, Collection<Long> applicationIds) {
        if (applicationIds.isEmpty()) return Set.of();
        return reviews.findByReviewerIdAndApplicationIdIn(reviewerId, applicationIds)
            .stream().map(Review::getApplicationId).collect(Collectors.toSet());
    }

    private JobPost jobOf(Review review) {
        return applications.findById(review.getApplicationId())
            .flatMap(app -> jobs.findById(app.getJobId()))
            .orElse(null);
    }

    private ReviewResponse toResponse(Review review, JobPost job) {
        return new ReviewResponse(
            review.getId(), review.getApplicationId(),
            job == null ? null : job.getTitle(),
            review.getReviewerId(), displayName(review.getReviewerId()),
            review.getRating(), review.getComment(), review.getCreatedAt());
    }

    // Nhà tuyển dụng hiển thị tên đơn vị (nếu có), sinh viên hiển thị họ tên.
    private String displayName(Long userId) {
        return employerProfiles.findById(userId)
            .map(EmployerProfile::getOrganizationName)
            .filter(name -> name != null && !name.isBlank())
            .orElseGet(() -> users.findById(userId).map(User::getFullName).orElse("Người dùng"));
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
    }
}
