package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.JobPost;
import com.studentfreelance.backend.entity.JobStatus;
import com.studentfreelance.backend.entity.ModerationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JobPostRepository
        extends JpaRepository<JobPost, Long> {

    List<JobPost> findByJobStatusOrderByCreatedAtDesc(
        JobStatus jobStatus
    );

    // FR-12: trang chủ chỉ hiện tin OPEN đã được ADMIN duyệt
    List<JobPost> findByJobStatusAndModerationStatusOrderByCreatedAtDesc(
        JobStatus jobStatus,
        ModerationStatus moderationStatus
    );

    // FR-12: hàng đợi duyệt tin của ADMIN (tin cũ nhất lên trước)
    List<JobPost> findByModerationStatusOrderByCreatedAtAsc(
        ModerationStatus moderationStatus
    );

    List<JobPost> findAllByOrderByCreatedAtDesc();

    long countByModerationStatus(ModerationStatus moderationStatus);

    List<JobPost> findByEmployerIdOrderByCreatedAtDesc(
        Long employerId
    );

    Optional<JobPost> findByIdAndEmployerId(
        Long id,
        Long employerId
    );
}
