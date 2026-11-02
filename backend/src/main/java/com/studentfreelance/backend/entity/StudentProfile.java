package com.studentfreelance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    // Shared primary key with users.id (no auto increment)
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(length = 20)
    private String phone;

    @Column(length = 150)
    private String school;

    @Column(length = 150)
    private String major;

    @Column(name = "cv_url", length = 500)
    private String cvUrl;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    public StudentProfile() {}

    public StudentProfile(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() { return userId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }
    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }
}
