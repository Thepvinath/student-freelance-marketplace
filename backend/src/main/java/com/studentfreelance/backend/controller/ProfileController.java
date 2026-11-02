package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.ProfileResponse;
import com.studentfreelance.backend.dto.UpdateProfileRequest;
import com.studentfreelance.backend.service.ProfileService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public ProfileResponse getMyProfile(Authentication authentication) {
        return service.getMyProfile(currentUserId(authentication));
    }

    @PutMapping("/me")
    public ProfileResponse updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        return service.updateMyProfile(currentUserId(authentication), request);
    }

    private static Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
