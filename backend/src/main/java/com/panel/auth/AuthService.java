package com.panel.auth;

import com.panel.auth.dto.LoginRequest;
import com.panel.auth.dto.LoginResponse;
import com.panel.auth.dto.RefreshRequest;
import com.panel.security.LoginRateLimiter;
import com.panel.users.User;
import com.panel.users.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final LoginRateLimiter loginRateLimiter;

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        loginRateLimiter.checkAndIncrement(request.getUsername(), ip);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        loginRateLimiter.resetAttempts(request.getUsername(), ip);

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(900)
                .user(new LoginResponse.UserInfo(user.getId(), user.getUsername(), user.getRole()))
                .build();
    }

    public LoginResponse.AccessTokenResponse refresh(RefreshRequest request) {
        Claims claims = jwtTokenProvider.parseToken(request.getRefreshToken());
        UUID userId = UUID.fromString(claims.getSubject());

        if (!refreshTokenService.validateRefreshToken(userId, request.getRefreshToken())) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());

        return new LoginResponse.AccessTokenResponse(newAccessToken, 900);
    }

    public void logout(RefreshRequest request) {
        try {
            Claims claims = jwtTokenProvider.parseToken(request.getRefreshToken());
            UUID userId = UUID.fromString(claims.getSubject());
            refreshTokenService.deleteRefreshToken(userId);
        } catch (Exception e) {
            // Silently handle — always logout locally
        }
    }
}
