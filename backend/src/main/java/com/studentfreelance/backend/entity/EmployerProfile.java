package com.studentfreelance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "employer_profiles")
public class EmployerProfile {

    // Shared primary key with users.id (no auto increment)
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "organization_name", length = 200)
    private String organizationName;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String description;

    public EmployerProfile() {}

    public EmployerProfile(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() { return userId; }
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
