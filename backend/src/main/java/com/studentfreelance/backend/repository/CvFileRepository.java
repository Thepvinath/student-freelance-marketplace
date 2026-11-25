package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.CvFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CvFileRepository extends JpaRepository<CvFile, Long> {
    boolean existsByIdAndOwnerId(Long id, Long ownerId);
}
