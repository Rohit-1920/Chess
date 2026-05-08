package com.chessapp.dto.request;

import com.chessapp.enums.AiDifficulty;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameTheme;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateGameRequest {

    @NotNull(message = "Game mode is required")
    private GameMode gameMode;

    /** Required when gameMode = AI */
    private AiDifficulty aiDifficulty;

    /**
     * When mode is AI, which colour should the AI play?
     * Accepted values: "WHITE" | "BLACK"
     * Defaults to "BLACK" (human plays white) if not supplied.
     */
    private String aiPlaysAs;

    /** Board theme for the game */
    private GameTheme theme;

    /**
     * For ONLINE_MULTIPLAYER — the username / userId of the opponent
     * to challenge directly. If absent the game will appear in the lobby.
     */
    private String opponentUsername;
}
