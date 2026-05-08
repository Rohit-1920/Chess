package com.chessapp.controller;

import com.chessapp.dto.request.LoginRequest;
import com.chessapp.dto.request.RegisterRequest;
import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.AuthResponse;
import com.chessapp.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── POST /api/auth/register ─────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully", response));
    }

    // ─── POST /api/auth/login ────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    // ─── POST /api/auth/logout ───────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String authHeader,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token  = authHeader.substring(7);
            Long   userId = Long.parseLong(userDetails.getUsername());
            authService.logout(token, userId);
        }
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    // ─── POST /api/auth/refresh ──────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody RefreshRequest request) {

        AuthResponse response = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", response));
    }

    // ─── GET /api/auth/me ────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Long>> me(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userId));
    }

    // ─── Inner record for refresh request ────────────────────────

    record RefreshRequest(String refreshToken) {}
}
