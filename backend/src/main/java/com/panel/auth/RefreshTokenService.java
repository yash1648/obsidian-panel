package com.panel.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_PREFIX = "refresh:";

    private final StringRedisTemplate redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    public String createRefreshToken(UUID userId) {
        String token = jwtTokenProvider.generateRefreshToken(userId);
        String key = REFRESH_PREFIX + userId;
        redisTemplate.opsForValue().set(key, token, Duration.ofDays(7));
        return token;
    }

    public boolean validateRefreshToken(UUID userId, String token) {
        String stored = redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);
        return stored != null && stored.equals(token);
    }

    public void deleteRefreshToken(UUID userId) {
        redisTemplate.delete(REFRESH_PREFIX + userId);
    }
}
