package com.chessapp.controller;

import com.chessapp.dto.request.FriendRequest;
import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.FriendResponse;
import com.chessapp.dto.response.UserSearchResponse;
import com.chessapp.service.FriendService;
import com.chessapp.service.PresenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService   friendService;
    private final PresenceService presenceService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<FriendResponse>> sendRequest(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody FriendRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Friend request sent",
                friendService.sendFriendRequest(id(ud), req.getUsername())));
    }

    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<ApiResponse<FriendResponse>> accept(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long friendshipId) {
        return ResponseEntity.ok(ApiResponse.ok("Friend request accepted",
                friendService.acceptFriendRequest(id(ud), friendshipId)));
    }

    @DeleteMapping("/{friendshipId}/decline")
    public ResponseEntity<ApiResponse<Void>> decline(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long friendshipId) {
        friendService.declineFriendRequest(id(ud), friendshipId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long friendshipId) {
        friendService.removeFriend(id(ud), friendshipId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(
            @AuthenticationPrincipal UserDetails ud) {
        presenceService.setOnline(id(ud));
        return ResponseEntity.ok(ApiResponse.ok(friendService.getFriends(id(ud))));
    }

    @GetMapping("/pending/received")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> pendingReceived(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getPendingReceived(id(ud))));
    }

    @GetMapping("/pending/sent")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> pendingSent(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.getPendingSent(id(ud))));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserSearchResponse>>> search(
            @AuthenticationPrincipal UserDetails ud, @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(friendService.searchUsers(id(ud), q)));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Void>> heartbeat(@AuthenticationPrincipal UserDetails ud) {
        presenceService.heartbeat(id(ud));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long id(UserDetails u) { return Long.parseLong(u.getUsername()); }
}
