package com.chessapp.model;

import com.chessapp.enums.AiDifficulty;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameStatus;
import com.chessapp.enums.GameTheme;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    public static final String INITIAL_FEN =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // White-side player (null for LOCAL_MULTIPLAYER guest)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "white_player_id")
    private User whitePlayer;

    // Black-side player (null for AI or LOCAL_MULTIPLAYER guest)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "black_player_id")
    private User blackPlayer;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_mode", nullable = false, length = 30)
    private GameMode gameMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_difficulty", length = 10)
    private AiDifficulty aiDifficulty;

    /** When game mode is AI, which colour does the AI play? */
    @Column(name = "ai_plays_as", length = 10)
    private String aiPlaysAs; // "WHITE" | "BLACK"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private GameStatus status = GameStatus.WAITING;

    @Column(name = "current_fen", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String currentFen = INITIAL_FEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", nullable = false, length = 30)
    @Builder.Default
    private GameTheme theme = GameTheme.CLASSIC;

    @Column(name = "move_count", nullable = false)
    @Builder.Default
    private Integer moveCount = 0;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Move> moves = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ─── Helpers ───────────────────────────────────────────────

    public boolean isAiGame() {
        return GameMode.AI.equals(this.gameMode);
    }

    public boolean isOnlineMultiplayer() {
        return GameMode.ONLINE_MULTIPLAYER.equals(this.gameMode);
    }

    /** True if the given user is a participant of this game */
    public boolean hasPlayer(Long userId) {
        if (userId == null) return false;
        boolean isWhite = whitePlayer != null && whitePlayer.getId().equals(userId);
        boolean isBlack = blackPlayer != null && blackPlayer.getId().equals(userId);
        return isWhite || isBlack;
    }

    /** Returns "WHITE" or "BLACK" for the given userId, or null if not a player */
    public String getColorForPlayer(Long userId) {
        if (whitePlayer != null && whitePlayer.getId().equals(userId)) return "WHITE";
        if (blackPlayer != null && blackPlayer.getId().equals(userId)) return "BLACK";
        return null;
    }
}
