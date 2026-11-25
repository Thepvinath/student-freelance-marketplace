package com.studentfreelance.backend.controller;

import com.studentfreelance.backend.dto.CvFileResponse;
import com.studentfreelance.backend.entity.CvFile;
import com.studentfreelance.backend.entity.Role;
import com.studentfreelance.backend.service.CvFileService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

// Sprint 5: tải lên và xem CV dạng PDF (xem SecurityConfig: POST chỉ STUDENT, GET cần đăng nhập)
@RestController
@RequestMapping("/api/files/cv")
public class CvFileController {

    private final CvFileService service;

    public CvFileController(CvFileService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CvFileResponse upload(@RequestParam("file") MultipartFile file, Authentication authentication) {
        return service.upload(Long.valueOf(authentication.getName()), file);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> view(@PathVariable Long id, Authentication authentication) {
        CvFile file = service.load(id, Long.valueOf(authentication.getName()), roleOf(authentication));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.inline().filename(file.getFileName(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .body(file.getData());
    }

    private static Role roleOf(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .map(authority -> authority.getAuthority())
            .filter(name -> name.startsWith("ROLE_"))
            .map(name -> Role.valueOf(name.substring(5)))
            .findFirst()
            .orElse(null);
    }
}
