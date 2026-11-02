package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping("/api/jobs/{jobId}/applications")
    public ResponseEntity<ApplicationResponse> apply(@PathVariable Long jobId,
                                                      @Valid @RequestBody ApplyJobRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.apply(jobId, currentUserId(authentication), request));
    }

    @GetMapping("/api/applications/mine")
    public List<ApplicationResponse> mine(Authentication authentication) {
        return service.myApplications(currentUserId(authentication));
    }

    @GetMapping("/api/jobs/{jobId}/applications")
    public List<ApplicationResponse> forJob(@PathVariable Long jobId,
                                            Authentication authentication) {
        return service.jobApplications(jobId, currentUserId(authentication));
    }

    @PatchMapping("/api/applications/{id}/status")
    public ApplicationResponse updateStatus(@PathVariable Long id,
                                            @Valid @RequestBody UpdateApplicationStatusRequest request,
                                            Authentication authentication) {
        return service.updateStatus(id, currentUserId(authentication), request);
    }

    private static Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
