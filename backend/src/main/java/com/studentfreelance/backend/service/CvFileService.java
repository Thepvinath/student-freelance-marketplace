package com.studentfreelance.backend.service;

import com.studentfreelance.backend.dto.CvFileResponse;
import com.studentfreelance.backend.entity.CvFile;
import com.studentfreelance.backend.entity.Role;
import com.studentfreelance.backend.repository.ApplicationRepository;
import com.studentfreelance.backend.repository.CvFileRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Sprint 5: sinh viên chọn file CV (PDF) thay vì dán liên kết.
// File lưu trong MySQL để không mất khi Railway triển khai lại.
@Service
public class CvFileService {

    public static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final Pattern INTERNAL_URL = Pattern.compile("^/api/files/cv/(\\d+)$");
    private static final byte[] PDF_MAGIC = {'%', 'P', 'D', 'F', '-'};

    private final CvFileRepository files;
    private final ApplicationRepository applications;

    public CvFileService(CvFileRepository files, ApplicationRepository applications) {
        this.files = files;
        this.applications = applications;
    }

    @Transactional
    public CvFileResponse upload(Long ownerId, MultipartFile upload) {
        if (upload == null || upload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is required");
        }
        if (upload.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "CV must be 5 MB or smaller");
        }
        byte[] data;
        try {
            data = upload.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot read file");
        }
        // Kiểm tra nội dung thật là PDF (không tin phần đuôi tên file)
        if (data.length < PDF_MAGIC.length
                || !Arrays.equals(Arrays.copyOf(data, PDF_MAGIC.length), PDF_MAGIC)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "CV must be a PDF file");
        }

        CvFile file = new CvFile();
        file.setOwnerId(ownerId);
        file.setFileName(safeName(upload.getOriginalFilename()));
        file.setContentType("application/pdf");
        file.setSizeBytes(data.length);
        file.setData(data);
        CvFile saved = files.saveAndFlush(file);
        return new CvFileResponse(saved.getId(), saved.getFileName(), saved.getSizeBytes(), urlOf(saved.getId()));
    }

    // Chủ file, ADMIN, hoặc nhà tuyển dụng đã nhận đơn có CV này. Người khác → 404 (không lộ là file có tồn tại).
    @Transactional(readOnly = true)
    public CvFile load(Long id, Long viewerId, Role viewerRole) {
        CvFile file = files.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV not found"));
        boolean allowed = file.getOwnerId().equals(viewerId)
            || viewerRole == Role.ADMIN
            || (viewerRole == Role.EMPLOYER && applications.existsCvForEmployer(urlOf(id), viewerId));
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CV not found");
        }
        return file;
    }

    // cvUrl hợp lệ: liên kết http(s) bên ngoài, hoặc file CV đã tải lên của CHÍNH sinh viên đó.
    public String checkCvUrl(String value, Long ownerId) {
        String url = value == null || value.isBlank() ? null : value.trim();
        if (url == null) return null;

        Matcher internal = INTERNAL_URL.matcher(url);
        if (internal.matches()) {
            if (files.existsByIdAndOwnerId(Long.valueOf(internal.group(1)), ownerId)) return url;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cvUrl must be your own uploaded CV");
        }
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
            "cvUrl must be an http(s) URL or an uploaded CV");
    }

    public static String urlOf(Long id) {
        return "/api/files/cv/" + id;
    }

    // Bỏ đường dẫn thư mục, ký tự điều khiển và ngoặc kép; giữ tối đa 255 ký tự
    static String safeName(String original) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"]", "").trim();
        if (name.isEmpty()) name = "CV.pdf";
        if (!name.toLowerCase().endsWith(".pdf")) name = name + ".pdf";
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }
}
