package com.studentfreelance.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.DispatcherType;

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
            // Stateless REST API
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // HTTP 401 / 403
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                    new HttpStatusEntryPoint(
                        HttpStatus.UNAUTHORIZED
                    )
                )
                .accessDeniedHandler(
                    (request, response, exception) -> {
                        response.setStatus(
                            HttpServletResponse.SC_FORBIDDEN
                        );
                    }
                )
            )

            // API Authorization
            .authorizeHttpRequests(auth -> auth

                // Allow Spring Boot to handle API errors
                .dispatcherTypeMatchers(DispatcherType.ERROR)
                 .permitAll()

                // Public Authentication APIs
                .requestMatchers(
                    HttpMethod.POST, "/api/auth/register"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.POST, "/api/auth/login"
                ).permitAll()

                // Public Test API
                .requestMatchers(
                    HttpMethod.GET, "/api/hello"
                ).permitAll()

                // Role Test APIs
                .requestMatchers("/api/test/student")
                    .hasRole("STUDENT")

                .requestMatchers("/api/test/employer")
                    .hasRole("EMPLOYER")

                .requestMatchers("/api/test/admin")
                    .hasRole("ADMIN")

                // Employer: view own jobs
                .requestMatchers(
                    HttpMethod.GET, "/api/jobs/mine"
                ).hasRole("EMPLOYER")

                // Public: browse OPEN jobs
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/jobs",
                    "/api/jobs/*"
                ).permitAll()

                // Employer: create jobs
                .requestMatchers(
                    HttpMethod.POST, "/api/jobs"
                ).hasRole("EMPLOYER")

                // Employer: update jobs
                .requestMatchers(
                    HttpMethod.PUT, "/api/jobs/*"
                ).hasRole("EMPLOYER")

                // Employer: mark jobs as FILLED
                .requestMatchers(
                    HttpMethod.PATCH, "/api/jobs/*/fill"
                ).hasRole("EMPLOYER")

                // Deny all unspecified requests
                .anyRequest().denyAll()
            )

            // JWT Authentication Filter
            .addFilterBefore(
                new JwtAuthenticationFilter(
                    jwtService,
                    userRepository
                ),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
