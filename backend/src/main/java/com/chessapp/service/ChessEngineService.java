package com.chessapp.service;

import com.chessapp.exception.InvalidMoveException;
import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Piece;
import com.github.bhlangonijr.chesslib.Square;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.move.MoveList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Wraps the chesslib library for:
 *  - Move validation
 *  - FEN generation
 *  - Game-state checks (checkmate, stalemate, draw)
 *  - Random move selection for EASY AI
 */
@Service
@Slf4j
public class ChessEngineService {

    private final Random rng = new Random();

    // ─── Board Factory ───────────────────────────────────────────

    /** Create a Board loaded from the given FEN string. */
    public Board boardFromFen(String fen) {
        Board board = new Board();
        board.loadFromFen(fen);
        return board;
    }

    // ─── Move Validation ─────────────────────────────────────────

    /**
     * Validates and applies a move on the supplied FEN.
     *
     * @param currentFen  the board position before the move
     * @param fromSquare  e.g. "e2"
     * @param toSquare    e.g. "e4"
     * @param promotion   e.g. "q" — null/blank if not a promotion
     * @return the new FEN after the move is applied
     * @throws InvalidMoveException if the move is illegal
     */
    public String applyMove(String currentFen,
                            String fromSquare,
                            String toSquare,
                            String promotion) {

        Board board = boardFromFen(currentFen);
        Move  move  = buildMove(fromSquare, toSquare, promotion, board);

        // Check legality against the list of all legal moves
        MoveList legalMoves = board.legalMoves();
        boolean legal = false;
        for (Move m : legalMoves) {
            if (m.getFrom().equals(move.getFrom()) && m.getTo().equals(move.getTo())
                    && m.getPromotion().equals(move.getPromotion())) {
                legal = true;
                break;
            }
        }

        if (!legal) {
            throw new InvalidMoveException(
                    "Illegal move: " + fromSquare + toSquare
                    + (promotion != null ? promotion : ""));
        }

        board.doMove(move);
        return board.getFen();
    }

    /**
     * Returns all legal moves for the side to move as UCI strings.
     */
    public List<String> getLegalMovesUci(String fen) {
        Board board = boardFromFen(fen);
        MoveList legalMoves = board.legalMoves();
        List<String> result = new ArrayList<>(legalMoves.size());
        for (Move m : legalMoves) {
            result.add(moveToUci(m));
        }
        return result;
    }

    // ─── Game-State Checks ───────────────────────────────────────

    public boolean isCheckmate(String fen) {
        Board board = boardFromFen(fen);
        return board.isMated();
    }

    public boolean isStalemate(String fen) {
        Board board = boardFromFen(fen);
        return board.isStaleMate();
    }

    public boolean isDraw(String fen) {
        Board board = boardFromFen(fen);
        return board.isDraw();
    }

    public boolean isGameOver(String fen) {
        Board board = boardFromFen(fen);
        return board.isMated() || board.isStaleMate() || board.isDraw();
    }

    public boolean isInCheck(String fen) {
        Board board = boardFromFen(fen);
        return board.isKingAttacked();
    }

    /**
     * Returns "WHITE", "BLACK", or null for the side to move next.
     */
    public String getSideToMove(String fen) {
        Board board = boardFromFen(fen);
        return board.getSideToMove().name();
    }

    // ─── Easy AI — Random Legal Move ─────────────────────────────

    /**
     * Picks a random legal move from the current position.
     * Returns the move as UCI string (e.g. "e2e4") or null if no moves exist.
     */
    public String getRandomMove(String fen) {
        Board board = boardFromFen(fen);
        MoveList legalMoves = board.legalMoves();
        if (legalMoves.isEmpty()) return null;

        Move chosen = legalMoves.get(rng.nextInt(legalMoves.size()));
        return moveToUci(chosen);
    }

    // ─── Utilities ───────────────────────────────────────────────

    public String moveToUci(Move move) {
        String uci = move.getFrom().name().toLowerCase() + move.getTo().name().toLowerCase();
        if (!Piece.NONE.equals(move.getPromotion())) {
            // Piece name like "WHITE_QUEEN" → we want just "q"
            String promoName = move.getPromotion().name(); // e.g. "WHITE_QUEEN"
            String promoChar = String.valueOf(promoName.charAt(promoName.lastIndexOf('_') + 1))
                                      .toLowerCase();
            uci += promoChar;
        }
        return uci;
    }

    /** Parse a UCI string (e.g. "e2e4" or "e7e8q") into from/to/promotion strings */
    public String[] parseUci(String uci) {
        // returns [fromSquare, toSquare, promotionChar or ""]
        if (uci == null || uci.length() < 4) {
            throw new InvalidMoveException("Invalid UCI move: " + uci);
        }
        String from  = uci.substring(0, 2);
        String to    = uci.substring(2, 4);
        String promo = uci.length() == 5 ? String.valueOf(uci.charAt(4)) : "";
        return new String[]{from, to, promo};
    }

    // ─── Internal ────────────────────────────────────────────────

    private Move buildMove(String from, String to, String promotionStr, Board board) {
        Square fromSq = Square.valueOf(from.toUpperCase());
        Square toSq   = Square.valueOf(to.toUpperCase());

        Piece promotionPiece = Piece.NONE;
        if (promotionStr != null && !promotionStr.isBlank()) {
            promotionPiece = resolvePromotion(promotionStr,
                    board.getSideToMove().name());
        }
        return new Move(fromSq, toSq, promotionPiece);
    }

    private Piece resolvePromotion(String promoChar, String side) {
        // side = "WHITE" | "BLACK", promoChar = "q" | "r" | "b" | "n"
        String pieceName = side + "_" + switch (promoChar.toLowerCase()) {
            case "q" -> "QUEEN";
            case "r" -> "ROOK";
            case "b" -> "BISHOP";
            case "n" -> "KNIGHT";
            default  -> "QUEEN";
        };
        try {
            return Piece.valueOf(pieceName);
        } catch (IllegalArgumentException e) {
            return Piece.NONE;
        }
    }
}
