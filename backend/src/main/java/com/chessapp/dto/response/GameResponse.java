package com.chessapp.dto.response;

import com.chessapp.enums.AiDifficulty;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameStatus;
import com.chessapp.enums.GameTheme;
import com.chessapp.model.Game;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameResponse {

    private Long id;
    private GameMode gameMode;
    private GameStatus status;
    private AiDifficulty aiDifficulty;
    private String aiPlaysAs;
    private GameTheme theme;
    private String currentFen;
    private Integer moveCount;

    // Simplified player info to avoid circular references
    private PlayerInfo whitePlayer;
    private PlayerInfo blackPlayer;
    private PlayerInfo winner;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** What colour the requesting user plays (WHITE / BLACK / null for spectator) */
    private String myColor;

    // ─── Nested DTO ──────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerInfo {
        private Long id;
        private String username;
        private String displayName;
        private String avatarUrl;
        private Integer rating;
    }

    // ─── Mapper ──────────────────────────────────────────────────

    public static GameResponse from(Game game) {
        return from(game, null);
    }

    public static GameResponse from(Game game, Long requestingUserId) {
        PlayerInfo white = game.getWhitePlayer() == null ? null : PlayerInfo.builder()
                .id(game.getWhitePlayer().getId())
                .username(game.getWhitePlayer().getUsername())
                .displayName(game.getWhitePlayer().getDisplayName())
                .avatarUrl(game.getWhitePlayer().getAvatarUrl())
                .rating(game.getWhitePlayer().getRating())
                .build();

        PlayerInfo black = game.getBlackPlayer() == null ? null : PlayerInfo.builder()
                .id(game.getBlackPlayer().getId())
                .username(game.getBlackPlayer().getUsername())
                .displayName(game.getBlackPlayer().getDisplayName())
                .avatarUrl(game.getBlackPlayer().getAvatarUrl())
                .rating(game.getBlackPlayer().getRating())
                .build();

        PlayerInfo winner = game.getWinner() == null ? null : PlayerInfo.builder()
                .id(game.getWinner().getId())
                .username(game.getWinner().getUsername())
                .displayName(game.getWinner().getDisplayName())
                .build();

        String myColor = requestingUserId != null ? game.getColorForPlayer(requestingUserId) : null;

        return GameResponse.builder()
                .id(game.getId())
                .gameMode(game.getGameMode())
                .status(game.getStatus())
                .aiDifficulty(game.getAiDifficulty())
                .aiPlaysAs(game.getAiPlaysAs())
                .theme(game.getTheme())
                .currentFen(game.getCurrentFen())
                .moveCount(game.getMoveCount())
                .whitePlayer(white)
                .blackPlayer(black)
                .winner(winner)
                .myColor(myColor)
                .createdAt(game.getCreatedAt())
                .updatedAt(game.getUpdatedAt())
                .build();
    }
}
