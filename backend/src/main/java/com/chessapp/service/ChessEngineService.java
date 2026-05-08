package com.chessapp.service;

import com.chessapp.exception.InvalidMoveException;
import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Piece;
import com.github.bhlangonijr.chesslib.Square;
import com.github.bhlangonijr.chesslib.move.Move;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@Slf4j
public class ChessEngineService {

    private final Random rng = new Random();

    public Board boardFromFen(String fen) {
        Board board = new Board();
        board.loadFromFen(fen);
        return board;
    }

    public String applyMove(String currentFen, String fromSquare, String toSquare, String promotion) {
        Board board = boardFromFen(currentFen);
        Move move = buildMove(fromSquare, toSquare, promotion, board);

        List<Move> legalMoves = board.legalMoves();
        boolean legal = false;
        for (Move m : legalMoves) {
            if (m.getFrom().equals(move.getFrom())
                    && m.getTo().equals(move.getTo())
                    && m.getPromotion().equals(move.getPromotion())) {
                legal = true;
                break;
            }
        }

        if (!legal) {
            throw new InvalidMoveException(
                    "Illegal move: " + fromSquare + toSquare + (promotion != null ? promotion : ""));
        }

        board.doMove(move);
        return board.getFen();
    }

    public List<String> getLegalMovesUci(String fen) {
        Board board = boardFromFen(fen);
        List<Move> legalMoves = board.legalMoves();
        List<String> result = new ArrayList<>(legalMoves.size());
        for (Move m : legalMoves) {
            result.add(moveToUci(m));
        }
        return result;
    }

    public boolean isCheckmate(String fen) {
        return boardFromFen(fen).isMated();
    }

    public boolean isStalemate(String fen) {
        return boardFromFen(fen).isStaleMate();
    }

    public boolean isDraw(String fen) {
        return boardFromFen(fen).isDraw();
    }

    public boolean isGameOver(String fen) {
        Board board = boardFromFen(fen);
        return board.isMated() || board.isStaleMate() || board.isDraw();
    }

    public boolean isInCheck(String fen) {
        return boardFromFen(fen).isKingAttacked();
    }

    public String getSideToMove(String fen) {
        return boardFromFen(fen).getSideToMove().name();
    }

    public String getRandomMove(String fen) {
        Board board = boardFromFen(fen);
        List<Move> legalMoves = board.legalMoves();
        if (legalMoves.isEmpty()) return null;
        Move chosen = legalMoves.get(rng.nextInt(legalMoves.size()));
        return moveToUci(chosen);
    }

    public String moveToUci(Move move) {
        String uci = move.getFrom().name().toLowerCase() + move.getTo().name().toLowerCase();
        if (!Piece.NONE.equals(move.getPromotion())) {
            String promoName = move.getPromotion().name();
            String promoChar = String.valueOf(promoName.charAt(promoName.lastIndexOf('_') + 1)).toLowerCase();
            uci += promoChar;
        }
        return uci;
    }

    public String[] parseUci(String uci) {
        if (uci == null || uci.length() < 4) {
            throw new InvalidMoveException("Invalid UCI move: " + uci);
        }
        String from  = uci.substring(0, 2);
        String to    = uci.substring(2, 4);
        String promo = uci.length() == 5 ? String.valueOf(uci.charAt(4)) : "";
        return new String[]{from, to, promo};
    }

    private Move buildMove(String from, String to, String promotionStr, Board board) {
        Square fromSq = Square.valueOf(from.toUpperCase());
        Square toSq   = Square.valueOf(to.toUpperCase());
        Piece promotionPiece = Piece.NONE;
        if (promotionStr != null && !promotionStr.isBlank()) {
            promotionPiece = resolvePromotion(promotionStr, board.getSideToMove().name());
        }
        return new Move(fromSq, toSq, promotionPiece);
    }

    private Piece resolvePromotion(String promoChar, String side) {
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
