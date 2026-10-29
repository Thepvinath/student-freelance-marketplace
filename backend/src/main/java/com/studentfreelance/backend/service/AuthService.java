package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (request.role() == Role.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "ADMIN registration is not allowed"
            );
        }

        String email = request.email().trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email already registered"
            );
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(
            passwordEncoder.encode(request.password())
        );
        user.setRole(request.role());
        user.setAccountStatus("ACTIVE");

        User saved = userRepository.save(user);

        return new RegisterResponse(
            saved.getId(),
            saved.getFullName(),
            saved.getEmail(),
            saved.getRole()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String email = request.email().trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                    )
                );

        if (!passwordEncoder.matches(
                request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Account is not active"
            );
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(
            token,
            "Bearer",
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole()
        );
    }
}
