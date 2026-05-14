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

        // null userId = guest user
        Long userId = userDetails != null ? parseUserId(userDetails) : null;
        GameResponse game = gameService.createGame(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Game created", game));
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<ApiResponse<GameResponse>> joinGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = parseUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Joined game", gameService.joinGame(gameId, userId)));
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<ApiResponse<GameResponse>> getGame(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = userDetails != null ? parseUserId(userDetails) : null;
        return ResponseEntity.ok(ApiResponse.ok(gameService.getGame(gameId, userId)));
    }

    @PostMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<MoveResponse>> makeMove(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId,
            @Valid @RequestBody MakeMoveRequest request) {

        // Guest users (null) can make moves in LOCAL_MULTIPLAYER
        Long userId = userDetails != null ? parseUserId(userDetails) : null;
        MoveResponse result = gameService.makeMove(gameId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Move accepted", result));
    }

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<ApiResponse<List<MoveResponse>>> getMoves(@PathVariable Long gameId) {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getMovesForGame(gameId)));
    }

    @PostMapping("/{gameId}/resign")
    public ResponseEntity<ApiResponse<GameResponse>> resign(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long gameId) {

        Long userId = parseUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("You resigned", gameService.resign(gameId, userId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getMyGames(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = parseUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(gameService.getMyGames(userId, page, Math.min(size, 50))));
    }

    @GetMapping("/lobby")
    public ResponseEntity<ApiResponse<List<GameResponse>>> getLobby() {
        return ResponseEntity.ok(ApiResponse.ok(gameService.getOpenLobbies()));
    }

    private Long parseUserId(UserDetails u) {
        return Long.parseLong(u.getUsername());
    }
}
