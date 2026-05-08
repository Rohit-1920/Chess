package com.chessapp.controller;

import com.chessapp.dto.request.MakeMoveRequest;
import com.chessapp.dto.response.GameResponse;
import com.chessapp.dto.response.MoveResponse;
import com.chessapp.dto.response.WebSocketMessage;
import com.chessapp.enums.GameStatus;
import com.chessapp.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket STOMP controller for real-time chess gameplay.
 *
 * Client connects to:  ws://host/ws  (SockJS endpoint)
 * Client subscribes:   /topic/game/{gameId}     ← broadcast game events
 *                      /user/queue/errors        ← private error messages
 *
 * Client sends to:     /app/game/{gameId}/move   → make a move
 *                      /app/game/{gameId}/join   → join a game
 *                      /app/game/{gameId}/resign → resign
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate  messagingTemplate;
    private final GameService            gameService;

    // ─── Subscribe to a game channel ─────────────────────────────

    /**
     * Called when a client subscribes to /app/game/{gameId}.
     * Returns the current game state immediately as a handshake.
     */
    @SubscribeMapping("/game/{gameId}")
    public WebSocketMessage onSubscribe(@DestinationVariable Long gameId,
                                        Principal principal) {
        try {
            Long userId = principal != null ? Long.parseLong(principal.getName()) : null;
            GameResponse game = gameService.getGame(gameId, userId);

            return WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.PLAYER_JOINED)
                    .payload(game)
                    .message("Connected to game " + gameId)
                    .build();
        } catch (Exception e) {
            return WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.ERROR)
                    .message("Game not found: " + gameId)
                    .build();
        }
    }

    // ─── Make a Move ─────────────────────────────────────────────

    /**
     * Receives a move from a client and broadcasts the result to all
     * subscribers of /topic/game/{gameId}.
     */
    @MessageMapping("/game/{gameId}/move")
    public void handleMove(@DestinationVariable Long gameId,
                           @Valid @Payload MakeMoveRequest moveRequest,
                           Principal principal) {

        if (principal == null) {
            sendError(null, "Unauthenticated — cannot make a move");
            return;
        }

        Long userId = Long.parseLong(principal.getName());

        try {
            MoveResponse result = gameService.makeMove(gameId, userId, moveRequest);

            WebSocketMessage msg = WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.MOVE_MADE)
                    .payload(result)
                    .message("Move played: " + moveRequest.getFromSquare() + moveRequest.getToSquare())
                    .build();

            // Broadcast to everyone subscribed to this game
            messagingTemplate.convertAndSend("/topic/game/" + gameId, msg);

            // If game ended, also broadcast GAME_OVER
            if (result.getGame() != null) {
                GameResponse game = result.getGame();
                GameStatus status = game.getStatus();
                if (GameStatus.COMPLETED.equals(status) || GameStatus.DRAW.equals(status)) {

                    WebSocketMessage gameOverMsg = WebSocketMessage.builder()
                            .type(WebSocketMessage.Type.GAME_OVER)
                            .payload(game)
                            .message(buildGameOverMessage(game))
                            .build();

                    messagingTemplate.convertAndSend("/topic/game/" + gameId, gameOverMsg);
                }
            }

        } catch (Exception e) {
            log.warn("Move error in game {}: {}", gameId, e.getMessage());
            sendError(principal.getName(), e.getMessage());
        }
    }

    // ─── Join Game (WS) ──────────────────────────────────────────

    @MessageMapping("/game/{gameId}/join")
    public void handleJoin(@DestinationVariable Long gameId, Principal principal) {
        if (principal == null) return;

        Long userId = Long.parseLong(principal.getName());

        try {
            GameResponse game = gameService.joinGame(gameId, userId);

            WebSocketMessage msg = WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.GAME_STARTED)
                    .payload(game)
                    .message("Game started! Good luck.")
                    .build();

            messagingTemplate.convertAndSend("/topic/game/" + gameId, msg);
        } catch (Exception e) {
            log.warn("Join error in game {}: {}", gameId, e.getMessage());
            sendError(principal.getName(), e.getMessage());
        }
    }

    // ─── Resign (WS) ─────────────────────────────────────────────

    @MessageMapping("/game/{gameId}/resign")
    public void handleResign(@DestinationVariable Long gameId, Principal principal) {
        if (principal == null) return;

        Long userId = Long.parseLong(principal.getName());

        try {
            GameResponse game = gameService.resign(gameId, userId);

            WebSocketMessage msg = WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.GAME_OVER)
                    .payload(game)
                    .message("A player resigned.")
                    .build();

            messagingTemplate.convertAndSend("/topic/game/" + gameId, msg);
        } catch (Exception e) {
            sendError(principal.getName(), e.getMessage());
        }
    }

    // ─── Chat (in-game) ──────────────────────────────────────────

    @MessageMapping("/game/{gameId}/chat")
    public void handleChat(@DestinationVariable Long gameId,
                           @Payload String chatMessage,
                           Principal principal) {

        String sender = principal != null ? principal.getName() : "Guest";

        WebSocketMessage msg = WebSocketMessage.builder()
                .type(WebSocketMessage.Type.CHAT)
                .payload(chatMessage)
                .message(sender)
                .build();

        messagingTemplate.convertAndSend("/topic/game/" + gameId, msg);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private void sendError(String userId, String errorMsg) {
        WebSocketMessage err = WebSocketMessage.builder()
                .type(WebSocketMessage.Type.ERROR)
                .message(errorMsg)
                .build();

        if (userId != null) {
            messagingTemplate.convertAndSendToUser(userId, "/queue/errors", err);
        }
    }

    private String buildGameOverMessage(GameResponse game) {
        if (game.getWinner() != null) {
            return game.getWinner().getUsername() + " wins!";
        }
        return "Game drawn.";
    }
}
