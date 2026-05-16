package com.chessapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final StringRedisTemplate redisTemplate;
    private static final String PREFIX = "presence:user:";
    private static final Duration TTL = Duration.ofMinutes(5);

    public void setOnline(Long userId) {
        redisTemplate.opsForValue().set(PREFIX + userId, "1", TTL);
    }

    public void setOffline(Long userId) {
        redisTemplate.delete(PREFIX + userId);
    }

    public boolean isOnline(Long userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + userId));
    }

    public void heartbeat(Long userId) {
        redisTemplate.expire(PREFIX + userId, TTL);
    }

    public Set<Long> getOnlineUserIds(List<Long> userIds) {
        return userIds.stream().filter(this::isOnline).collect(Collectors.toSet());
    }
}
