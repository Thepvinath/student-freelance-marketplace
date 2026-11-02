package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.EmployerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Long> {
}
