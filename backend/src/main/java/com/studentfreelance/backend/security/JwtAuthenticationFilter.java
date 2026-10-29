package com.studentfreelance.backend.security;

import com.studentfreelance.backend.entity.User;
import com.studentfreelance.backend.repository.UserRepository;
import com.studentfreelance.backend.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring(7).trim();
            Claims claims = jwtService.validateAndGetClaims(token);

            Long userId = Long.parseLong(claims.getSubject());

            User user = userRepository.findById(userId)
                    .orElse(null);

            if (user == null ||
                    !"ACTIVE".equals(user.getAccountStatus())) {
                response.sendError(401, "Account unavailable");
                return;
            }

            var authority = new SimpleGrantedAuthority(
                    "ROLE_" + user.getRole().name()
            );

            var authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getId().toString(),
                            null,
                            List.of(authority)
                    );

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            response.sendError(401, "Invalid or expired token");
            return;
        }

        chain.doFilter(request, response);
    }
}
