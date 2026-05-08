package com.chessapp.dto.response;

import com.chessapp.model.Move;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class MoveResponse {

    private Long id;
    private Integer moveNumber;
    private String fromSquare;
    private String toSquare;
    private String promotionPiece;
    private String sanNotation;
    private String uci;               // e.g. "e2e4"
    private String fenAfterMove;
    private Boolean isAiMove;
    private Long playerId;
    private String playerUsername;
    private LocalDateTime createdAt;

    // The full updated game state — so the frontend only needs one response
    private GameResponse game;

    // If the AI responded, include the AI's move too
    private MoveResponse aiMove;

    public static MoveResponse from(Move move) {
        return MoveResponse.builder()
                .id(move.getId())
                .moveNumber(move.getMoveNumber())
                .fromSquare(move.getFromSquare())
                .toSquare(move.getToSquare())
                .promotionPiece(move.getPromotionPiece())
                .sanNotation(move.getSanNotation())
                .uci(move.toUci())
                .fenAfterMove(move.getFenAfterMove())
                .isAiMove(move.getIsAiMove())
                .playerId(move.getPlayer() != null ? move.getPlayer().getId() : null)
                .playerUsername(move.getPlayer() != null ? move.getPlayer().getUsername() : null)
                .createdAt(move.getCreatedAt())
                .build();
    }
}
