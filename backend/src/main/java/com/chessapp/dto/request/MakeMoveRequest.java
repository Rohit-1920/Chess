package com.chessapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class MakeMoveRequest {

    /** Source square in lowercase algebraic notation, e.g. "e2" */
    @NotBlank(message = "fromSquare is required")
    @Pattern(regexp = "^[a-h][1-8]$", message = "fromSquare must be a valid square (e.g. e2)")
    private String fromSquare;

    /** Target square in lowercase algebraic notation, e.g. "e4" */
    @NotBlank(message = "toSquare is required")
    @Pattern(regexp = "^[a-h][1-8]$", message = "toSquare must be a valid square (e.g. e4)")
    private String toSquare;

    /**
     * Promotion piece in lowercase UCI notation: q, r, b, n
     * Only required when a pawn reaches the last rank.
     */
    @Pattern(regexp = "^[qrbn]$", message = "promotionPiece must be one of: q, r, b, n")
    private String promotionPiece;
}
