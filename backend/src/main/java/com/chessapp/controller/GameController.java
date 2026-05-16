package com.chessapp.controller;

import com.chessapp.dto.request.CreateGameRequest;
import com.chessapp.dto.request.MakeMoveRequest;
import com.chessapp.dto.response.ApiResponse;
import com.chessapp.dto.response.GameResponse;
import com.chessapp.dto.response.MoveResponse;
import com.chessapp.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @PostMapping
    public ResponseEntity<ApiResponse<GameResponse>> createGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateGameRequest request) {
        Long userId = userId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Game created", gameService.createGame(userId, request)));
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<ApiResponse<GameResponse>> joinGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok("Joined",
                gameService.joinGame(gameId, requireUserId(userDetails))));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getMyGames(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                gameService.getMyGames(requireUserId(userDetails), page, Math.min(size, 50))));
    }

    @GetMapping("/lobby")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getLobby() {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getOpenLobbies()));
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<ApiResponse<GameResponse>> getGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getGame(gameId, userId(userDetails))));
    }

    @PostMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<MoveResponse>> makeMove(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId,
            @Valid @RequestBody MakeMoveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Move accepted",
                gameService.makeMove(gameId, userId(userDetails), request)));
    }

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<List<MoveResponse>>> getMoves(@PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getMovesForGame(gameId)));
    }

    @PostMapping("/{gameId}/resign")
    public ResponseEntity<ApiResponse<GameResponse>> resign(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok("Resigned",
                gameService.resign(gameId, requireUserId(userDetails))));
    }

    // Nullable — for guest-compatible endpoints
    private Long userId(UserDetails u) {
        return u != null ? Long.parseLong(u.getUsername()) : null;
    }

    // Non-null — throws if guest tries to access auth-required endpoint
    private Long requireUserId(UserDetails u) {
        if (u == null) throw new RuntimeException("Authentication required");
        return Long.parseLong(u.getUsername());
    }
}
