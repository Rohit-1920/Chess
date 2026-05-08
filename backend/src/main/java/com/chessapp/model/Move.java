package com.chessapp.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "moves",
        indexes = {
                @Index(name = "idx_moves_game", columnList = "game_id"),
                @Index(name = "idx_moves_game_number", columnList = "game_id, move_number")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Move {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    // null for AI moves or LOCAL_MULTIPLAYER guests
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private User player;

    @Column(name = "move_number", nullable = false)
    private Integer moveNumber;

    /** Source square in algebraic notation, e.g. "e2" */
    @Column(name = "from_square", nullable = false, length = 2)
    private String fromSquare;

    /** Target square in algebraic notation, e.g. "e4" */
    @Column(name = "to_square", nullable = false, length = 2)
    private String toSquare;

    /** Promotion piece in UCI notation: q, r, b, n (null if not a promotion) */
    @Column(name = "promotion_piece", length = 10)
    private String promotionPiece;

    /** Standard Algebraic Notation, e.g. "Nf3" or "O-O" */
    @Column(name = "san_notation", length = 10)
    private String sanNotation;

    /** Full FEN string of the board *after* this move was applied */
    @Column(name = "fen_after_move", nullable = false, columnDefinition = "TEXT")
    private String fenAfterMove;

    @Column(name = "is_ai_move", nullable = false)
    @Builder.Default
    private Boolean isAiMove = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Convenience: UCI string for this move, e.g. "e2e4" or "e7e8q" */
    public String toUci() {
        String uci = fromSquare + toSquare;
        if (promotionPiece != null && !promotionPiece.isBlank()) {
            uci += promotionPiece.toLowerCase();
        }
        return uci;
    }
}
