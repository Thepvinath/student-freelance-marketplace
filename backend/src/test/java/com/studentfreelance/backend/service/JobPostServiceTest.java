package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.JobPostRequest;
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

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): quy tắc tin tuyển dụng – FR-05, FR-09, khung giờ Sprint 4,
// loại hình và duyệt tin Sprint 5 (FR-12)
class JobPostServiceTest {

    private JobPostRepository jobs;
    private ApplicationRepository applications;
    private NotificationService notifications;
    private UserRepository users;
    private JobPostService service;

    @BeforeEach
    void setUp() {
        jobs = mock(JobPostRepository.class);
        applications = mock(ApplicationRepository.class);
        notifications = mock(NotificationService.class);
        users = mock(UserRepository.class);
        service = new JobPostService(jobs, applications, mock(EntityManager.class), notifications, users);
    }

    private static JobPostRequest request(LocalTime start, LocalTime end) {
        return new JobPostRequest("Phục vụ ca chiều", "Mô tả", "Dịch vụ ăn uống", "Quận 3, TP. Hồ Chí Minh",
            new BigDecimal("25000"), new BigDecimal("28000"), SalaryUnit.HOUR, "Thứ Hai – thứ Sáu", start, end,
            EmploymentType.PART_TIME);
    }

    private static User admin(long id) {
        User admin = new User();
        ReflectionTestUtils.setField(admin, "id", id);
        admin.setRole(Role.ADMIN);
        return admin;
    }

    private static JobPost job(long id, long employerId, JobStatus status) {
        JobPost job = new JobPost();
        ReflectionTestUtils.setField(job, "id", id);
        job.setEmployerId(employerId);
        job.setTitle("Phục vụ ca chiều");
        job.setJobStatus(status);
        job.setModerationStatus(ModerationStatus.APPROVED);
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

    @Test
    @DisplayName("TC-U14: Đăng tin mới → chờ duyệt (PENDING), lưu loại hình và báo cho ADMIN")
    void newJobWaitsForAdminApproval() {
        when(users.findByRole(Role.ADMIN)).thenReturn(List.of(admin(9L)));
        when(jobs.saveAndFlush(any(JobPost.class))).thenAnswer(call -> call.getArgument(0));
        JobPostRequest fullTime = new JobPostRequest("Nhân viên văn phòng", "Mô tả", "Văn phòng",
            "Phường Sài Gòn, TP. Hồ Chí Minh", new BigDecimal("8000000"), new BigDecimal("10000000"),
            SalaryUnit.MONTH, "Thứ Hai – thứ Sáu", LocalTime.of(8, 0), LocalTime.of(17, 0), EmploymentType.FULL_TIME);

        var response = service.create(fullTime, 3L);

        assertThat(response.moderationStatus()).isEqualTo(ModerationStatus.PENDING);
        assertThat(response.employmentType()).isEqualTo(EmploymentType.FULL_TIME);
        assertThat(response.salaryUnit()).isEqualTo(SalaryUnit.MONTH);
        verify(notifications).notify(eq(9L), isNull(), contains("đang chờ duyệt"));
    }

    @Test
    @DisplayName("TC-U15: Trang chủ chỉ lấy tin OPEN đã được duyệt")
    void publicListOnlyShowsApprovedJobs() {
        when(jobs.findByJobStatusAndModerationStatusOrderByCreatedAtDesc(JobStatus.OPEN, ModerationStatus.APPROVED))
            .thenReturn(List.of(job(10, 3, JobStatus.OPEN)));

        assertThat(service.getOpenJobs()).hasSize(1);
        verify(jobs, never()).findByJobStatusOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("TC-U16: Sửa tin đã duyệt → quay lại chờ duyệt, xóa lý do cũ")
    void editingApprovedJobRequiresNewReview() {
        JobPost approved = job(10, 3, JobStatus.OPEN);
        approved.setModerationNote("cũ");
        when(jobs.findByIdAndEmployerId(10L, 3L)).thenReturn(Optional.of(approved));
        when(jobs.saveAndFlush(approved)).thenReturn(approved);

        var response = service.update(10L, 3L, request(LocalTime.of(17, 0), LocalTime.of(19, 0)));

        assertThat(response.moderationStatus()).isEqualTo(ModerationStatus.PENDING);
        assertThat(response.moderationNote()).isNull();
    }
}
