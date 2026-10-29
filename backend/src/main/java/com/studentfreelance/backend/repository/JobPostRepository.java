package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.JobPost;
import com.studentfreelance.backend.entity.JobStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JobPostRepository
        extends JpaRepository<JobPost, Long> {

    List<JobPost> findByJobStatusOrderByCreatedAtDesc(
        JobStatus jobStatus
    );

    List<JobPost> findByEmployerIdOrderByCreatedAtDesc(
        Long employerId
    );

    Optional<JobPost> findByIdAndEmployerId(
        Long id,
        Long employerId
    );
}
