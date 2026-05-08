package com.chessapp.service;

import com.chessapp.dto.request.UpdateProfileRequest;
import com.chessapp.dto.response.UserProfileResponse;
import com.chessapp.exception.ConflictException;
import com.chessapp.exception.ResourceNotFoundException;
import com.chessapp.model.User;
import com.chessapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    // ─── Get Profile ─────────────────────────────────────────────

    @Cacheable(value = "userProfiles", key = "#userId")
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = getUser(userId);
        return UserProfileResponse.from(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", 0L));
        return UserProfileResponse.from(user);
    }

    // ─── Update Profile ──────────────────────────────────────────

    @CacheEvict(value = "userProfiles", key = "#userId")
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = getUser(userId);

        if (req.getUsername() != null && !req.getUsername().equalsIgnoreCase(user.getUsername())) {
            if (userRepository.existsByUsername(req.getUsername())) {
                throw new ConflictException("Username '" + req.getUsername() + "' is already taken");
            }
            user.setUsername(req.getUsername().strip());
        }

        if (req.getDisplayName() != null) {
            user.setDisplayName(req.getDisplayName().strip());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().strip());
        }
        if (req.getPreferredTheme() != null) {
            user.setPreferredTheme(req.getPreferredTheme());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);
        return UserProfileResponse.from(user);
    }

    // ─── Stats Update (called by GameService) ────────────────────

    @CacheEvict(value = "userProfiles", key = "#userId")
    @Transactional
    public void recordWin(Long userId) {
        User user = getUser(userId);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        user.setGamesWon(user.getGamesWon() + 1);
        user.setRating(user.getRating() + 15);  // simple Elo delta
        userRepository.save(user);
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    @Transactional
    public void recordLoss(Long userId) {
        User user = getUser(userId);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        user.setGamesLost(user.getGamesLost() + 1);
        user.setRating(Math.max(100, user.getRating() - 15)); // floor at 100
        userRepository.save(user);
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    @Transactional
    public void recordDraw(Long userId) {
        User user = getUser(userId);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        user.setGamesDrawn(user.getGamesDrawn() + 1);
        userRepository.save(user);
    }

    // ─── Internal ────────────────────────────────────────────────

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
