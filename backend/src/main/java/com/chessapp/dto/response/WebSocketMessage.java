package com.chessapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * All WebSocket messages sent to /topic/game/{gameId} use this envelope.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {

    public enum Type {
        GAME_STARTED,       // Second player joined
        MOVE_MADE,          // A move was played (includes AI response if applicable)
        GAME_OVER,          // Checkmate / Stalemate / Draw / Resignation
        PLAYER_JOINED,      // A player connected to the WebSocket
        PLAYER_DISCONNECTED,// A player's WebSocket closed
        CHAT,               // In-game chat message
        ERROR               // Server-side validation error
    }

    private Type type;
    private Object payload;   // MoveResponse | GameResponse | ChatMessage | String
    private String message;   // Human-readable description / error message
}
