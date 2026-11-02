package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.*;
import com.studentfreelance.backend.entity.*;
import com.studentfreelance.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.net.URI;

@Service
public class ApplicationService {

    private final ApplicationRepository applications;
    private final JobPostRepository jobs;
    private final UserRepository users;
    private final EntityManager entityManager;

    public ApplicationService(ApplicationRepository applications,
                              JobPostRepository jobs,
                              UserRepository users,
                              EntityManager entityManager) {
        this.applications = applications;
        this.jobs = jobs;
        this.users = users;
        this.entityManager = entityManager;
    }

    @Transactional
    public ApplicationResponse apply(Long jobId, Long studentId, ApplyJobRequest request) {
        var student = users.findById(studentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can apply");
        }

        JobPost job = jobs.findById(jobId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        if (job.getJobStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Job is no longer open");
        }
        if (applications.existsByJobIdAndStudentId(jobId, studentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already applied for this job");
        }

        JobApplication application = new JobApplication();
        application.setJobId(jobId);
        application.setStudentId(studentId);
        application.setIntroduction(clean(request.introduction()));
        application.setCvUrl(validateCvUrl(request.cvUrl()));
        application.setStatus(ApplicationStatus.PENDING);

        try {
            JobApplication saved = applications.saveAndFlush(application);
            entityManager.refresh(saved); // get MySQL DEFAULT applied_at
            return toResponse(saved);
        } catch (DataIntegrityViolationException exception) {
            // Also enforce one application per student per job in MySQL.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Application already exists or violates a database constraint", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> myApplications(Long studentId) {
        return applications.findByStudentIdOrderByAppliedAtDesc(studentId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> jobApplications(Long jobId, Long employerId) {
        requireOwnedJob(jobId, employerId);
        return applications.findByJobIdOrderByAppliedAtDesc(jobId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ApplicationResponse updateStatus(Long applicationId,
                                            Long employerId,
                                            UpdateApplicationStatusRequest request) {
        JobApplication application = applications.findById(applicationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        requireOwnedJob(application.getJobId(), employerId);

        if (request.status() == ApplicationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Employer can only APPROVE or REJECT");
        }
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Application was already reviewed");
        }
        application.setStatus(request.status());
        return toResponse(applications.saveAndFlush(application));
    }

    private JobPost requireOwnedJob(Long jobId, Long employerId) {
        return jobs.findByIdAndEmployerId(jobId, employerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    }

    private ApplicationResponse toResponse(JobApplication application) {
        JobPost job = jobs.findById(application.getJobId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        User student = users.findById(application.getStudentId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        return new ApplicationResponse(
            application.getId(), job.getId(), job.getTitle(),
            student.getId(), student.getFullName(), student.getEmail(),
            application.getIntroduction(), application.getCvUrl(),
            application.getStatus(), application.getAppliedAt()
        );
    }

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
            // Convert invalid URLs to a useful 400 response below.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "cvUrl must be an http(s) URL");
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
