package com.chessapp.repository;

import com.chessapp.model.Move;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoveRepository extends JpaRepository<Move, Long> {

    /** All moves for a game ordered by move number ascending. */
    List<Move> findByGameIdOrderByMoveNumberAsc(Long gameId);

    /** Count of moves made in a game. */
    long countByGameId(Long gameId);

    /** The last move made in a game. */
    Move findTopByGameIdOrderByMoveNumberDesc(Long gameId);
}
