package com.studentfreelance.backend.service;

import com.studentfreelance.backend.repository.NotificationRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

// Unit test (không cần MySQL): thông báo – FR-11
class NotificationServiceTest {

    @Test
    @DisplayName("TC-U13: Đánh dấu đã đọc thông báo của người khác → 404")
    void cannotReadSomeoneElsesNotification() {
        NotificationRepository repository = mock(NotificationRepository.class);
        when(repository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());
        NotificationService service = new NotificationService(repository);

        assertThatThrownBy(() -> service.markRead(5L, 1L))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(HttpStatus.NOT_FOUND.value()));
        verify(repository, never()).saveAndFlush(any());
    }
}
