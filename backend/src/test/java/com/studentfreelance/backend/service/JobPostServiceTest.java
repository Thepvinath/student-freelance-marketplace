package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.JobPostRequest;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.ApplicationRepository;
import com.studentfreelance.backend.repository.JobPostRepository;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): quy tắc tin tuyển dụng – FR-05, FR-09, khung giờ Sprint 4
class JobPostServiceTest {

    private JobPostRepository jobs;
    private ApplicationRepository applications;
    private NotificationService notifications;
    private JobPostService service;

    @BeforeEach
    void setUp() {
        jobs = mock(JobPostRepository.class);
        applications = mock(ApplicationRepository.class);
        notifications = mock(NotificationService.class);
        service = new JobPostService(jobs, applications, mock(EntityManager.class), notifications);
    }

    private static JobPostRequest request(LocalTime start, LocalTime end) {
        return new JobPostRequest("Phục vụ ca chiều", "Mô tả", "Dịch vụ ăn uống", "Quận 3, TP. Hồ Chí Minh",
            new BigDecimal("25000"), new BigDecimal("28000"), "Thứ Hai – thứ Sáu", start, end);
    }

    private static JobPost job(long id, long employerId, JobStatus status) {
        JobPost job = new JobPost();
        ReflectionTestUtils.setField(job, "id", id);
        job.setEmployerId(employerId);
        job.setTitle("Phục vụ ca chiều");
        job.setJobStatus(status);
        return job;
    }

    private static HttpStatus statusOf(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    @DisplayName("TC-U01: Giờ kết thúc trước giờ bắt đầu → 400, không lưu tin")
    void rejectsEndTimeBeforeStartTime() {
        assertThatThrownBy(() -> service.create(request(LocalTime.of(19, 0), LocalTime.of(17, 0)), 3L))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(jobs, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U02: Chỉ có giờ bắt đầu, thiếu giờ kết thúc → 400")
    void rejectsOnlyStartTime() {
        assertThatThrownBy(() -> service.create(request(LocalTime.of(17, 0), null), 3L))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(jobs, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U03: Hoàn thành tin còn OPEN → 409")
    void cannotCompleteOpenJob() {
        when(jobs.findByIdAndEmployerId(10L, 3L)).thenReturn(Optional.of(job(10, 3, JobStatus.OPEN)));

        assertThatThrownBy(() -> service.markCompleted(10L, 3L))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(notifications, never()).notify(anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("TC-U04: Hoàn thành tin FILLED có đơn APPROVED → COMPLETED và báo cho sinh viên")
    void completesFilledJobAndNotifiesApprovedStudents() {
        JobPost filled = job(10, 3, JobStatus.FILLED);
        JobApplication approved = new JobApplication();
        ReflectionTestUtils.setField(approved, "id", 55L);
        approved.setJobId(10L);
        approved.setStudentId(1L);
        approved.setStatus(ApplicationStatus.APPROVED);

        when(jobs.findByIdAndEmployerId(10L, 3L)).thenReturn(Optional.of(filled));
        when(applications.existsByJobIdAndStatus(10L, ApplicationStatus.APPROVED)).thenReturn(true);
        when(applications.findByJobIdAndStatus(10L, ApplicationStatus.APPROVED)).thenReturn(List.of(approved));
        when(jobs.saveAndFlush(filled)).thenReturn(filled);

        var response = service.markCompleted(10L, 3L);

        assertThat(response.jobStatus()).isEqualTo(JobStatus.COMPLETED);
        verify(notifications).notify(eq(1L), eq(55L), contains("đã hoàn thành"));
    }
}
