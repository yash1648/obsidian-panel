package com.panel.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final StringRedisTemplate redisTemplate;

    public void checkAndIncrement(String username, String ip) {
        String key = "login:failed:" + ip;
        Long attempts = redisTemplate.opsForValue().increment(key);

        if (attempts == 1) {
            redisTemplate.expire(key, LOCK_DURATION);
        }

        if (attempts > MAX_ATTEMPTS) {
            throw new RuntimeException("Account locked for 15 minutes due to too many failed attempts.");
        }
    }

    public void resetAttempts(String username, String ip) {
        redisTemplate.delete("login:failed:" + ip);
    }
}
