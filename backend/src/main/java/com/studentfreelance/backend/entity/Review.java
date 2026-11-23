package com.studentfreelance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// FR-10: Đánh giá 1–5 sao sau khi công việc hoàn thành.
// Mỗi người chỉ đánh giá một lần cho một đơn ứng tuyển (UNIQUE application_id, reviewer_id).
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "reviewee_id", nullable = false)
    private Long revieweeId;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Review() {}

    public Review(Long applicationId, Long reviewerId, Long revieweeId, Integer rating, String comment) {
        this.applicationId = applicationId;
        this.reviewerId = reviewerId;
        this.revieweeId = revieweeId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() { return id; }
    public Long getApplicationId() { return applicationId; }
    public Long getReviewerId() { return reviewerId; }
    public Long getRevieweeId() { return revieweeId; }
    public Integer getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
