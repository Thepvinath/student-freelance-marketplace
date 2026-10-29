package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.JobPostRepository;

import jakarta.persistence.EntityManager;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class JobPostService {

    private final JobPostRepository repository;
    private final EntityManager entityManager;

    public JobPostService(
            JobPostRepository repository,
            EntityManager entityManager) {
        this.repository = repository;
        this.entityManager = entityManager;
    }

    // Public: list only OPEN jobs
    @Transactional(readOnly = true)
    public List<JobPostResponse> getOpenJobs() {
        return repository
            .findByJobStatusOrderByCreatedAtDesc(JobStatus.OPEN)
            .stream()
            .map(JobPostResponse::from)
            .toList();
    }

    // Public: view an OPEN job
    @Transactional(readOnly = true)
    public JobPostResponse getJob(Long id) {
        JobPost job = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            ));

        if (job.getJobStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            );
        }

        return JobPostResponse.from(job);
    }

    // Employer: view own jobs
    @Transactional(readOnly = true)
    public List<JobPostResponse> getMyJobs(Long employerId) {
        return repository
            .findByEmployerIdOrderByCreatedAtDesc(employerId)
            .stream()
            .map(JobPostResponse::from)
            .toList();
    }

    // Employer: create job
    @Transactional
    public JobPostResponse create(
            JobPostRequest request,
            Long employerId) {

        validateSalary(request);

        JobPost job = new JobPost();
        job.setEmployerId(employerId);
        job.setJobStatus(JobStatus.OPEN);

        applyRequest(job, request);

        JobPost saved = repository.saveAndFlush(job);

        // Reload database-generated created_at
        entityManager.refresh(saved);

        return JobPostResponse.from(saved);
    }

    // Employer: update own OPEN job
    @Transactional
    public JobPostResponse update(
            Long id,
            Long employerId,
            JobPostRequest request) {

        JobPost job = findOwnedJob(id, employerId);

        if (job.getJobStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only OPEN jobs can be edited"
            );
        }

        validateSalary(request);
        applyRequest(job, request);

        return JobPostResponse.from(
            repository.saveAndFlush(job)
        );
    }

    // Employer: mark own OPEN job as FILLED
    @Transactional
    public JobPostResponse markFilled(
            Long id, Long employerId) {

        JobPost job = findOwnedJob(id, employerId);

        if (job.getJobStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Job is not OPEN"
            );
        }

        job.setJobStatus(JobStatus.FILLED);

        return JobPostResponse.from(
            repository.saveAndFlush(job)
        );
    }

    private JobPost findOwnedJob(Long id, Long employerId) {
        return repository
            .findByIdAndEmployerId(id, employerId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Job not found"
            ));
    }

    private void validateSalary(JobPostRequest request) {
        if (request.salaryMin().compareTo(
                request.salaryMax()) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "salaryMin cannot exceed salaryMax"
            );
        }
    }

    private void applyRequest(
            JobPost job, JobPostRequest request) {

        job.setTitle(request.title().trim());
        job.setDescription(request.description().trim());
        job.setIndustry(request.industry().trim());
        job.setLocation(request.location().trim());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setWorkSchedule(request.workSchedule().trim());
    }
}
