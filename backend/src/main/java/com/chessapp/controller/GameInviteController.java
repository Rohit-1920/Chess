package com.chessapp.controller;

import com.chessapp.dto.request.RespondToInviteRequest;
import com.chessapp.dto.request.SendGameInviteRequest;
import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.GameInviteResponse;
import com.chessapp.service.GameInviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
public class GameInviteController {

    private final GameInviteService inviteService;

    @PostMapping
    public ResponseEntity<ApiResponse<GameInviteResponse>> send(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody SendGameInviteRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Invite sent!", inviteService.sendInvite(id(ud), req)));
    }

    @PostMapping("/{inviteId}/respond")
    public ResponseEntity<ApiResponse<GameInviteResponse>> respond(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long inviteId,
            @Valid @RequestBody RespondToInviteRequest req) {
        if (Boolean.TRUE.equals(req.getAccepted())) {
            return ResponseEntity.ok(ApiResponse.ok("Game starting!",
                    inviteService.acceptInvite(id(ud), inviteId)));
        }
        inviteService.declineInvite(id(ud), inviteId);
        return ResponseEntity.ok(ApiResponse.ok("Invite declined", null));
    }

    @DeleteMapping("/{inviteId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @AuthenticationPrincipal UserDetails ud, @PathVariable Long inviteId) {
        inviteService.cancelInvite(id(ud), inviteId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GameInviteResponse>>> getAll(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(inviteService.getMyInvites(id(ud))));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<GameInviteResponse>>> getPending(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(inviteService.getPendingReceived(id(ud))));
    }

    private Long id(UserDetails u) { return Long.parseLong(u.getUsername()); }
}
