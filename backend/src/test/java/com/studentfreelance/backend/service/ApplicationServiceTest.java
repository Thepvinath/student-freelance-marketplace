package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.ApplyJobRequest;
import com.studentfreelance.backend.dto.UpdateApplicationStatusRequest;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.ApplicationRepository;
import com.studentfreelance.backend.repository.JobPostRepository;
import com.studentfreelance.backend.repository.UserRepository;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): ứng tuyển và duyệt đơn – FR-07, FR-08, FR-11
class ApplicationServiceTest {

    private ApplicationRepository applications;
    private JobPostRepository jobs;
    private UserRepository users;
    private NotificationService notifications;
    private ApplicationService service;

    private final User student = user(1L, "Nguyễn Minh Anh", Role.STUDENT);
    private final JobPost openJob = job(10L, 3L, JobStatus.OPEN);

    @BeforeEach
    void setUp() {
        applications = mock(ApplicationRepository.class);
        jobs = mock(JobPostRepository.class);
        users = mock(UserRepository.class);
        notifications = mock(NotificationService.class);
        ReviewService reviews = mock(ReviewService.class);
        service = new ApplicationService(applications, jobs, users, mock(EntityManager.class), notifications, reviews);
        when(users.findById(1L)).thenReturn(Optional.of(student));
    }

    private static User user(long id, String name, Role role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setFullName(name);
        user.setEmail("demo" + id + "@example.com");
        user.setRole(role);
        return user;
    }

    private static JobPost job(long id, long employerId, JobStatus status) {
        JobPost job = new JobPost();
        ReflectionTestUtils.setField(job, "id", id);
        job.setEmployerId(employerId);
        job.setTitle("Phục vụ quán cà phê ca tối");
        job.setJobStatus(status);
        return job;
    }

    private static HttpStatus statusOf(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    @DisplayName("TC-U05: Ứng tuyển tin không còn OPEN → 409")
    void cannotApplyToClosedJob() {
        when(jobs.findById(10L)).thenReturn(Optional.of(job(10L, 3L, JobStatus.FILLED)));

        assertThatThrownBy(() -> service.apply(10L, 1L, new ApplyJobRequest("Xin chào", null)))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(applications, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U06: Ứng tuyển lần hai cùng một tin → 409")
    void cannotApplyTwice() {
        when(jobs.findById(10L)).thenReturn(Optional.of(openJob));
        when(applications.existsByJobIdAndStudentId(10L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.apply(10L, 1L, new ApplyJobRequest("Xin chào", null)))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(applications, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U07: Ứng tuyển hợp lệ → PENDING và báo cho nhà tuyển dụng")
    void applyCreatesPendingApplicationAndNotifiesEmployer() {
        when(jobs.findById(10L)).thenReturn(Optional.of(openJob));
        when(applications.existsByJobIdAndStudentId(10L, 1L)).thenReturn(false);
        when(applications.saveAndFlush(any(JobApplication.class))).thenAnswer(call -> {
            JobApplication saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 77L);
            return saved;
        });

        var response = service.apply(10L, 1L, new ApplyJobRequest("Em làm được ca tối", "https://example.com/cv.pdf"));

        assertThat(response.status()).isEqualTo(ApplicationStatus.PENDING);
        verify(notifications).notify(eq(3L), eq(77L), contains("Nguyễn Minh Anh đã ứng tuyển"));
    }

    @Test
    @DisplayName("TC-U08: Duyệt lại đơn đã được duyệt → 409")
    void cannotReviewApplicationTwice() {
        JobApplication approved = new JobApplication();
        ReflectionTestUtils.setField(approved, "id", 77L);
        approved.setJobId(10L);
        approved.setStudentId(1L);
        approved.setStatus(ApplicationStatus.APPROVED);
        when(applications.findById(77L)).thenReturn(Optional.of(approved));
        when(jobs.findByIdAndEmployerId(10L, 3L)).thenReturn(Optional.of(openJob));

        assertThatThrownBy(() -> service.updateStatus(77L, 3L,
                new UpdateApplicationStatusRequest(ApplicationStatus.REJECTED)))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(notifications, never()).notify(anyLong(), any(), anyString());
    }
}
