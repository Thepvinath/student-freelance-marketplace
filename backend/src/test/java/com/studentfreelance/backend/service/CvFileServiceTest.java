package com.studentfreelance.backend.service;

import com.studentfreelance.backend.entity.CvFile;
import com.studentfreelance.backend.entity.Role;
import com.studentfreelance.backend.repository.ApplicationRepository;
import com.studentfreelance.backend.repository.CvFileRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): Sprint 5 – tải CV dạng PDF và quyền xem CV
class CvFileServiceTest {

    private CvFileRepository files;
    private ApplicationRepository applications;
    private CvFileService service;

    @BeforeEach
    void setUp() {
        files = mock(CvFileRepository.class);
        applications = mock(ApplicationRepository.class);
        service = new CvFileService(files, applications);
    }

    private static HttpStatus statusOf(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    private static CvFile stored(long id, long ownerId) {
        CvFile file = new CvFile();
        ReflectionTestUtils.setField(file, "id", id);
        file.setOwnerId(ownerId);
        file.setFileName("CV.pdf");
        return file;
    }

    @Test
    @DisplayName("TC-U20: Tải file PDF → lưu và trả về đường dẫn /api/files/cv/{id}")
    void uploadsPdf() {
        when(files.saveAndFlush(any(CvFile.class))).thenAnswer(call -> {
            CvFile file = call.getArgument(0);
            ReflectionTestUtils.setField(file, "id", 5L);
            return file;
        });
        var pdf = new MockMultipartFile("file", "../CV Minh Anh.pdf", "application/pdf",
            "%PDF-1.4 demo".getBytes(StandardCharsets.US_ASCII));

        var response = service.upload(1L, pdf);

        assertThat(response.url()).isEqualTo("/api/files/cv/5");
        assertThat(response.fileName()).isEqualTo("CV Minh Anh.pdf");
    }

    @Test
    @DisplayName("TC-U21: File không phải PDF (dù đặt tên .pdf) → 415, không lưu")
    void rejectsNonPdf() {
        var fake = new MockMultipartFile("file", "cv.pdf", "application/pdf",
            "<html>not a pdf</html>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.upload(1L, fake))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
        verify(files, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("TC-U22: Sinh viên khác xem CV → 404; nhà tuyển dụng nhận đơn có CV → được xem")
    void onlyOwnerOrReceivingEmployerCanView() {
        when(files.findById(5L)).thenReturn(Optional.of(stored(5L, 1L)));
        when(applications.existsCvForEmployer("/api/files/cv/5", 3L)).thenReturn(true);

        assertThatThrownBy(() -> service.load(5L, 2L, Role.STUDENT))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> service.load(5L, 4L, Role.EMPLOYER))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(service.load(5L, 1L, Role.STUDENT).getId()).isEqualTo(5L);
        assertThat(service.load(5L, 3L, Role.EMPLOYER).getId()).isEqualTo(5L);
    }

    @Test
    @DisplayName("TC-U23: Gắn CV của người khác vào hồ sơ / đơn → 400")
    void cannotAttachSomeoneElsesCv() {
        when(files.existsByIdAndOwnerId(5L, 2L)).thenReturn(false);
        when(files.existsByIdAndOwnerId(5L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.checkCvUrl("/api/files/cv/5", 2L))
            .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(service.checkCvUrl("/api/files/cv/5", 1L)).isEqualTo("/api/files/cv/5");
        assertThat(service.checkCvUrl("https://drive.google.com/cv.pdf", 2L)).startsWith("https://");
        assertThat(service.checkCvUrl("  ", 2L)).isNull();
    }
}
