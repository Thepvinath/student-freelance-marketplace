package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByJobIdAndStudentId(Long jobId, Long studentId);
    List<JobApplication> findByStudentIdOrderByAppliedAtDesc(Long studentId);
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);
}
