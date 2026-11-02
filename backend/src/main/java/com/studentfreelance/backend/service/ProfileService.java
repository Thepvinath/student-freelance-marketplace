package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.ProfileResponse;
import com.studentfreelance.backend.dto.UpdateProfileRequest;
import com.studentfreelance.backend.entity.EmployerProfile;
import com.studentfreelance.backend.entity.Role;
import com.studentfreelance.backend.entity.StudentProfile;
import com.studentfreelance.backend.entity.User;
import com.studentfreelance.backend.repository.EmployerProfileRepository;
import com.studentfreelance.backend.repository.StudentProfileRepository;
import com.studentfreelance.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

@Service
public class ProfileService {

    private final UserRepository users;
    private final StudentProfileRepository studentProfiles;
    private final EmployerProfileRepository employerProfiles;

    public ProfileService(UserRepository users,
                          StudentProfileRepository studentProfiles,
                          EmployerProfileRepository employerProfiles) {
        this.users = users;
        this.studentProfiles = studentProfiles;
        this.employerProfiles = employerProfiles;
    }

    // GET: a missing profile row returns empty fields (not 404)
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);

        return switch (user.getRole()) {
            case STUDENT -> toResponse(user,
                studentProfiles.findById(userId)
                    .orElseGet(() -> new StudentProfile(userId)));
            case EMPLOYER -> toResponse(user,
                employerProfiles.findById(userId)
                    .orElseGet(() -> new EmployerProfile(userId)));
            default -> throw noProfile();
        };
    }

    // PUT: create the profile row on first save, otherwise update it
    @Transactional
    public ProfileResponse updateMyProfile(Long userId,
                                           UpdateProfileRequest request) {
        User user = findUser(userId);
        if (user.getRole() != Role.STUDENT && user.getRole() != Role.EMPLOYER) {
            throw noProfile();
        }

        user.setFullName(request.fullName().trim());
        users.save(user);

        if (user.getRole() == Role.STUDENT) {
            StudentProfile profile = studentProfiles.findById(userId)
                .orElseGet(() -> new StudentProfile(userId));
            profile.setPhone(clean(request.phone()));
            profile.setSchool(clean(request.school()));
            profile.setMajor(clean(request.major()));
            profile.setCvUrl(validateCvUrl(request.cvUrl()));
            profile.setIntroduction(clean(request.introduction()));
            return toResponse(user, studentProfiles.save(profile));
        }

        EmployerProfile profile = employerProfiles.findById(userId)
            .orElseGet(() -> new EmployerProfile(userId));
        profile.setOrganizationName(clean(request.organizationName()));
        profile.setContactPhone(clean(request.contactPhone()));
        profile.setDescription(clean(request.description()));
        return toResponse(user, employerProfiles.save(profile));
    }

    private User findUser(Long userId) {
        return users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private static ResponseStatusException noProfile() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Only STUDENT and EMPLOYER accounts have a profile");
    }

    private static ProfileResponse toResponse(User user, StudentProfile p) {
        return new ProfileResponse(
            user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
            p.getPhone(), p.getSchool(), p.getMajor(), p.getCvUrl(), p.getIntroduction(),
            null, null, null);
    }

    private static ProfileResponse toResponse(User user, EmployerProfile p) {
        return new ProfileResponse(
            user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
            null, null, null, null, null,
            p.getOrganizationName(), p.getContactPhone(), p.getDescription());
    }

    // Same rule as ApplicationService: only http(s) URLs
    private static String validateCvUrl(String value) {
        String url = clean(value);
        if (url == null) return null;
        try {
            URI parsed = URI.create(url);
            String scheme = parsed.getScheme();
            if (parsed.getHost() != null && scheme != null &&
                (scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) {
                return url;
            }
        } catch (IllegalArgumentException ignored) {
            // handled below
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "cvUrl must be an http(s) URL");
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
