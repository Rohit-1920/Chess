package com.chessapp.repository;

import com.chessapp.enums.GameStatus;
import com.chessapp.model.Game;
import com.chessapp.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    /**
     * All games where the given user plays white or black, newest first.
     */
    @Query("SELECT g FROM Game g WHERE g.whitePlayer = :user OR g.blackPlayer = :user ORDER BY g.createdAt DESC")
    Page<Game> findByPlayer(@Param("user") User user, Pageable pageable);

    /**
     * Games with a specific status involving a given user.
     */
    @Query("SELECT g FROM Game g WHERE (g.whitePlayer = :user OR g.blackPlayer = :user) AND g.status = :status")
    List<Game> findByPlayerAndStatus(@Param("user") User user, @Param("status") GameStatus status);

    /**
     * Games that are WAITING for a second player (online multiplayer lobby).
     */
    List<Game> findByStatusOrderByCreatedAtAsc(GameStatus status);

    /**
     * Find a game by id, eagerly loading both players to avoid N+1.
     */
    @Query("SELECT g FROM Game g LEFT JOIN FETCH g.whitePlayer LEFT JOIN FETCH g.blackPlayer WHERE g.id = :id")
    Optional<Game> findByIdWithPlayers(@Param("id") Long id);

    /**
     * Active game count for a user (IN_PROGRESS only).
     */
    @Query("SELECT COUNT(g) FROM Game g WHERE (g.whitePlayer.id = :userId OR g.blackPlayer.id = :userId) AND g.status = 'IN_PROGRESS'")
    long countActiveGamesByUserId(@Param("userId") Long userId);
}
