package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.ReviewRequest;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.*;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): đánh giá hai chiều – FR-10
class ReviewServiceTest {

    private ReviewRepository reviews;
    private ApplicationRepository applications;
    private JobPostRepository jobs;
    private NotificationService notifications;
    private ReviewService service;

    private final JobApplication application = new JobApplication();

    @BeforeEach
    void setUp() {
        reviews = mock(ReviewRepository.class);
        applications = mock(ApplicationRepository.class);
        jobs = mock(JobPostRepository.class);
        notifications = mock(NotificationService.class);
        UserRepository users = mock(UserRepository.class);
        EmployerProfileRepository employerProfiles = mock(EmployerProfileRepository.class);
        service = new ReviewService(reviews, applications, jobs, users, employerProfiles, notifications, mock(EntityManager.class));

        ReflectionTestUtils.setField(application, "id", 77L);
        application.setJobId(10L);
        application.setStudentId(1L);
        application.setStatus(ApplicationStatus.APPROVED);
        when(applications.findById(77L)).thenReturn(Optional.of(application));

        User student = new User();
        ReflectionTestUtils.setField(student, "id", 1L);
        student.setFullName("Nguyễn Minh Anh");
        when(users.findById(1L)).thenReturn(Optional.of(student));
        when(employerProfiles.findById(anyLong())).thenReturn(Optional.empty());
    }

    private void jobWithStatus(JobStatus status) {
        JobPost job = new JobPost();
        ReflectionTestUtils.setField(job, "id", 10L);
        job.setEmployerId(3L);
        job.setTitle("Phục vụ quán cà phê ca tối");
        job.setJobStatus(status);
        when(jobs.findById(10L)).thenReturn(Optional.of(job));
    }

    private static HttpStatus statusOf(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    @DisplayName("TC-U09: Đánh giá khi công việc chưa hoàn thành → 409")
    void cannotReviewBeforeCompletion() {
        jobWithStatus(JobStatus.FILLED);

        assertThatThrownBy(() -> service.create(77L, 1L, new ReviewRequest(5, "Tốt")))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(reviews, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U10: Người không liên quan đến đơn đánh giá → 404")
    void strangerGetsNotFound() {
        jobWithStatus(JobStatus.COMPLETED);

        assertThatThrownBy(() -> service.create(77L, 99L, new ReviewRequest(5, null)))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("TC-U11: Đánh giá lần hai cho cùng một đơn → 409")
    void cannotReviewTwice() {
        jobWithStatus(JobStatus.COMPLETED);
        when(reviews.existsByApplicationIdAndReviewerId(77L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.create(77L, 1L, new ReviewRequest(4, null)))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(reviews, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U12: Sinh viên đánh giá → người được đánh giá là nhà tuyển dụng, có thông báo")
    void studentReviewsEmployer() {
        jobWithStatus(JobStatus.COMPLETED);
        when(reviews.existsByApplicationIdAndReviewerId(77L, 1L)).thenReturn(false);
        when(reviews.saveAndFlush(any(Review.class))).thenAnswer(call -> call.getArgument(0));

        var response = service.create(77L, 1L, new ReviewRequest(5, "  Hướng dẫn rõ ràng  "));

        ArgumentCaptor<Review> saved = ArgumentCaptor.forClass(Review.class);
        verify(reviews).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getRevieweeId()).isEqualTo(3L);
        assertThat(saved.getValue().getComment()).isEqualTo("Hướng dẫn rõ ràng");
        assertThat(response.rating()).isEqualTo(5);
        verify(notifications).notify(eq(3L), eq(77L), contains("5 sao"));
    }
}
