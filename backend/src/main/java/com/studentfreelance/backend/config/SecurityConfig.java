package com.studentfreelance.backend.config;

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
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                ))
.exceptionHandling(ex -> ex
    .authenticationEntryPoint(
        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
    )
    .accessDeniedHandler((request, response, exception) -> {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    })
)

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register")
                    .permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login")
                    .permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hello")
                    .permitAll()

                .requestMatchers("/api/test/student")
                    .hasRole("STUDENT")
                .requestMatchers("/api/test/employer")
                    .hasRole("EMPLOYER")
                .requestMatchers("/api/test/admin")
                    .hasRole("ADMIN")

                .anyRequest().denyAll()
            )
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtService, userRepository),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
