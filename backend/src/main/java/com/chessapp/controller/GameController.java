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

/**
 * REST controller for the game lifecycle.
 *
 * Endpoints:
 *   POST   /api/games                 — create a new game
 *   POST   /api/games/{id}/join       — join an online multiplayer game
 *   GET    /api/games/{id}            — get game state
 *   POST   /api/games/{id}/moves      — make a move
 *   GET    /api/games/{id}/moves      — full move history
 *   POST   /api/games/{id}/resign     — resign the game
 *   GET    /api/games/my              — my game history (paginated)
 *   GET    /api/games/lobby           — open games waiting for a second player
 */
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    // ─── Create ──────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<GameResponse>> createGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateGameRequest request) {

        Long userId = parseUserId(userDetails);
        GameResponse game = gameService.createGame(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Game created", game));
    }

    // ─── Join (Online Multiplayer) ────────────────────────────────

    @PostMapping("/{gameId}/join")
    public ResponseEntity<ApiResponse<GameResponse>> joinGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = parseUserId(userDetails);
        GameResponse game = gameService.joinGame(gameId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Joined game", game));
    }

    // ─── Get Game State ──────────────────────────────────────────

    @GetMapping("/{gameId}")
    public ResponseEntity<ApiResponse<GameResponse>> getGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = parseUserId(userDetails);
        GameResponse game = gameService.getGame(gameId, userId);
        return ResponseEntity.ok(ApiResponse.ok(game));
    }

    // ─── Make a Move ─────────────────────────────────────────────

    @PostMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<MoveResponse>> makeMove(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId,
            @Valid @RequestBody MakeMoveRequest request) {

        Long userId = parseUserId(userDetails);
        MoveResponse result = gameService.makeMove(gameId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Move accepted", result));
    }

    // ─── Move History ────────────────────────────────────────────

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<List<MoveResponse>>> getMoves(
            @PathVariable Long gameId) {

        List<MoveResponse> moves = gameService.getMovesForGame(gameId);
        return ResponseEntity.ok(ApiResponse.ok(moves));
    }

    // ─── Resign ──────────────────────────────────────────────────

    @PostMapping("/{gameId}/resign")
    public ResponseEntity<ApiResponse<GameResponse>> resign(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = parseUserId(userDetails);
        GameResponse game = gameService.resign(gameId, userId);
        return ResponseEntity.ok(ApiResponse.ok("You resigned. Better luck next time!", game));
    }

    // ─── My Games (paginated) ────────────────────────────────────

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getMyGames(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = parseUserId(userDetails);
        List<GameResponse> games = gameService.getMyGames(userId, page, Math.min(size, 50));
        return ResponseEntity.ok(ApiResponse.ok(games));
    }

    // ─── Open Lobby ──────────────────────────────────────────────

    @GetMapping("/lobby")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getLobby() {
        List<GameResponse> lobby = gameService.getOpenLobbies();
        return ResponseEntity.ok(ApiResponse.ok(lobby));
    }

    // ─── Internal ────────────────────────────────────────────────

    private Long parseUserId(UserDetails userDetails) {
        return Long.parseLong(userDetails.getUsername());
    }
}
