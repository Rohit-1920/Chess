package com.chessapp.controller;

import com.chessapp.dto.request.UpdateProfileRequest;
import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.UserProfileResponse;
import com.chessapp.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ─── GET /api/users/me ───────────────────────────────────────
    // Returns the full profile of the currently authenticated user.

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = parseUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(userId)));
    }

    // ─── PUT /api/users/me ───────────────────────────────────────
    // Update username, display name, avatar, preferred theme.

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {

        Long userId = parseUserId(userDetails);
        UserProfileResponse updated = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", updated));
    }

    // ─── GET /api/users/{username} ───────────────────────────────
    // Public-facing profile — useful for viewing an opponent's stats.

    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getPublicProfile(
            @PathVariable String username) {

        UserProfileResponse profile = userService.getProfileByUsername(username);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    // ─── Internal ────────────────────────────────────────────────

    private Long parseUserId(UserDetails userDetails) {
        return Long.parseLong(userDetails.getUsername());
    }
}
