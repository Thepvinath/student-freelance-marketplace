package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.service.JobPostService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobPostController {

    private final JobPostService jobPostService;

    public JobPostController(JobPostService jobPostService) {
        this.jobPostService = jobPostService;
    }

    @GetMapping
    public List<JobPostResponse> getJobs() {
        return jobPostService.getOpenJobs();
    }

    @GetMapping("/mine")
    public List<JobPostResponse> getMyJobs(
            Authentication authentication) {

        return jobPostService.getMyJobs(
            currentUserId(authentication)
        );
    }

    @GetMapping("/{id}")
    public JobPostResponse getJob(@PathVariable Long id) {
        return jobPostService.getJob(id);
    }

    @PostMapping
    public ResponseEntity<JobPostResponse> create(
            @Valid @RequestBody JobPostRequest request,
            Authentication authentication) {

        JobPostResponse created = jobPostService.create(
            request,
            currentUserId(authentication)
        );

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(created);
    }

    @PutMapping("/{id}")
    public JobPostResponse update(
            @PathVariable Long id,
            @Valid @RequestBody JobPostRequest request,
            Authentication authentication) {

        return jobPostService.update(
            id,
            currentUserId(authentication),
            request
        );
    }

    @PatchMapping("/{id}/fill")
    public JobPostResponse markFilled(
            @PathVariable Long id,
            Authentication authentication) {

        return jobPostService.markFilled(
            id,
            currentUserId(authentication)
        );
    }

    private Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
