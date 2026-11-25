package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.ApplicationStatus;
import com.studentfreelance.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByJobIdAndStudentId(Long jobId, Long studentId);
    List<JobApplication> findByStudentIdOrderByAppliedAtDesc(Long studentId);
    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);
    boolean existsByJobIdAndStatus(Long jobId, ApplicationStatus status);
    List<JobApplication> findByJobIdAndStatus(Long jobId, ApplicationStatus status);

    // Sprint 5: nhà tuyển dụng chỉ xem được CV đính kèm trong đơn gửi vào tin của mình
    @Query("select count(a) > 0 from JobApplication a, JobPost j "
         + "where a.jobId = j.id and j.employerId = :employerId and a.cvUrl = :cvUrl")
    boolean existsCvForEmployer(@Param("cvUrl") String cvUrl, @Param("employerId") Long employerId);
}
