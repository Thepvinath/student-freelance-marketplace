package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByApplicationIdAndReviewerId(Long applicationId, Long reviewerId);

    List<Review> findByRevieweeIdOrderByCreatedAtDescIdDesc(Long revieweeId);

    List<Review> findByReviewerIdAndApplicationIdIn(Long reviewerId, Collection<Long> applicationIds);
}
