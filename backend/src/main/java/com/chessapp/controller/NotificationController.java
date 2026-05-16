package com.chessapp.controller;

import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.NotificationResponse;
import com.chessapp.service.NotificationService;
import com.chessapp.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final PresenceService     presenceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll(
            @AuthenticationPrincipal UserDetails ud) {
        Long userId = id(ud);
        presenceService.setOnline(userId);
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getAll(userId)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnread(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnread(id(ud))));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> count(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("unreadCount", notificationService.getUnreadCount(id(ud)))));
    }

    @PutMapping("/{notifId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long notifId) {
        notificationService.markAsRead(notifId, id(ud));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllRead(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("markedAsRead", notificationService.markAllAsRead(id(ud)))));
    }

    private Long id(UserDetails u) { return Long.parseLong(u.getUsername()); }
}
