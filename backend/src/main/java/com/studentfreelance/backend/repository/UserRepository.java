package com.studentfreelance.backend.repository;

import com.studentfreelance.backend.entity.Role;
import com.studentfreelance.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // FR-12: báo cho mọi ADMIN khi có tin mới cần duyệt
    List<User> findByRole(Role role);
}
