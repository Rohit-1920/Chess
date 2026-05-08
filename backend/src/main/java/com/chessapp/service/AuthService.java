package com.chessapp.service;

import com.chessapp.dto.request.LoginRequest;
import com.chessapp.dto.request.RegisterRequest;
import com.chessapp.dto.response.AuthResponse;
import com.chessapp.dto.response.UserProfileResponse;
import com.chessapp.exception.BadRequestException;
import com.chessapp.exception.ConflictException;
import com.chessapp.exception.UnauthorizedException;
import com.chessapp.model.User;
import com.chessapp.repository.UserRepository;
import com.chessapp.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtTokenProvider    jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    private static final String REFRESH_KEY_PREFIX  = "jwt:refresh:";
    private static final String BLACKLIST_KEY_PREFIX = "jwt:blacklist:";

    // ─── Register ────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // At least one identifier (email or phone) is required
        boolean hasEmail = req.getEmail() != null && !req.getEmail().isBlank();
        boolean hasPhone = req.getPhone() != null && !req.getPhone().isBlank();

        if (!hasEmail && !hasPhone) {
            throw new BadRequestException("Either email or phone number is required");
        }

        // Uniqueness checks
        if (hasEmail && userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email address is already registered");
        }
        if (hasPhone && userRepository.existsByPhone(req.getPhone())) {
            throw new ConflictException("Phone number is already registered");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ConflictException("Username is already taken");
        }

        User user = User.builder()
                .email(hasEmail ? req.getEmail().toLowerCase().strip() : null)
                .phone(hasPhone ? req.getPhone().strip() : null)
                .username(req.getUsername().strip())
                .displayName(req.getDisplayName() != null
                        ? req.getDisplayName().strip()
                        : req.getUsername().strip())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} (id={})", user.getUsername(), user.getId());

        return issueTokens(user);
    }

    // ─── Login ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository
                .findByEmailOrPhoneOrUsername(req.getIdentifier().strip())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        log.info("User logged in: {} (id={})", user.getUsername(), user.getId());
        return issueTokens(user);
    }

    // ─── Refresh ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        Long   userId   = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);

        // Verify the refresh token is stored (rotation check)
        String storedKey = REFRESH_KEY_PREFIX + userId;
        String storedToken = redisTemplate.opsForValue().get(storedKey);
        if (!refreshToken.equals(storedToken)) {
            throw new UnauthorizedException("Refresh token has been rotated or revoked");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return issueTokens(user);
    }

    // ─── Logout ──────────────────────────────────────────────────

    public void logout(String accessToken, Long userId) {
        // Blacklist the access token for the remaining TTL
        redisTemplate.opsForValue().set(
                BLACKLIST_KEY_PREFIX + accessToken,
                "revoked",
                Duration.ofMillis(jwtTokenProvider.getExpirationMs()));

        // Remove the refresh token
        redisTemplate.delete(REFRESH_KEY_PREFIX + userId);
        log.info("User {} logged out", userId);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private AuthResponse issueTokens(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());

        // Store refresh token in Redis (TTL = 7 days)
        redisTemplate.opsForValue().set(
                REFRESH_KEY_PREFIX + user.getId(),
                refreshToken,
                Duration.ofDays(7));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationMs() / 1000)
                .user(UserProfileResponse.from(user))
                .build();
    }
}
