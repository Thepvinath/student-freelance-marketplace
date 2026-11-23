package com.studentfreelance.backend.config;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;

import com.studentfreelance.backend.repository.UserRepository;
import com.studentfreelance.backend.security.JwtAuthenticationFilter;
import com.studentfreelance.backend.service.JwtService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            UserRepository userRepository) throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                )
                .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Do not turn application errors into 401 responses.
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()

                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hello").permitAll()

                .requestMatchers("/api/test/student").hasRole("STUDENT")
                .requestMatchers("/api/test/employer").hasRole("EMPLOYER")
                .requestMatchers("/api/test/admin").hasRole("ADMIN")

                // Applications: deny students access to employer applicant lists.
                .requestMatchers(HttpMethod.POST, "/api/jobs/*/applications")
                    .hasRole("STUDENT")
                .requestMatchers(HttpMethod.GET, "/api/applications/mine")
                    .hasRole("STUDENT")
                .requestMatchers(HttpMethod.GET, "/api/jobs/*/applications")
                    .hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.PATCH, "/api/applications/*/status")
                    .hasRole("EMPLOYER")

                // Employers may manage only their own jobs (checked by JobPostService).
                .requestMatchers(HttpMethod.GET, "/api/jobs/mine")
                    .hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.GET, "/api/jobs", "/api/jobs/*")
                    .permitAll()
                .requestMatchers(HttpMethod.POST, "/api/jobs")
                    .hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.PUT, "/api/jobs/*")
                    .hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/fill")
                    .hasRole("EMPLOYER")
                .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/complete")
                    .hasRole("EMPLOYER")

                // Profile: STUDENT / EMPLOYER view and update their own profile.
                .requestMatchers(HttpMethod.GET, "/api/profile/me")
                    .hasAnyRole("STUDENT", "EMPLOYER")
                .requestMatchers(HttpMethod.PUT, "/api/profile/me")
                    .hasAnyRole("STUDENT", "EMPLOYER")

                // FR-10: đánh giá (người viết được kiểm tra trong ReviewService)
                .requestMatchers(HttpMethod.POST, "/api/applications/*/reviews")
                    .hasAnyRole("STUDENT", "EMPLOYER")
                .requestMatchers(HttpMethod.GET, "/api/users/*/reviews")
                    .permitAll()

                // FR-11: thông báo của chính tài khoản đang đăng nhập
                .requestMatchers(HttpMethod.GET, "/api/notifications", "/api/notifications/unread-count")
                    .hasAnyRole("STUDENT", "EMPLOYER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/notifications/*/read", "/api/notifications/read-all")
                    .hasAnyRole("STUDENT", "EMPLOYER", "ADMIN")

                // Sprint 5 – triển khai: Spring Boot phục vụ giao diện React đã build
                // (index.html, JS/CSS/font trong /assets) để web và API dùng chung một địa chỉ.
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/favicon.svg", "/icons.svg", "/assets/**")
                    .permitAll()

                .anyRequest().denyAll()
            )
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtService, userRepository),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
