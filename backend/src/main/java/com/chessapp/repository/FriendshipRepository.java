package com.chessapp.repository;

import com.chessapp.model.Friendship;
import com.chessapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requester = :a AND f.receiver = :b) OR " +
           "(f.requester = :b AND f.receiver = :a)")
    Optional<Friendship> findBetween(@Param("a") User a, @Param("b") User b);

    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requester.id = :userId OR f.receiver.id = :userId) " +
           "AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriends(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.receiver.id = :userId AND f.status = 'PENDING'")
    List<Friendship> findPendingReceived(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.requester.id = :userId AND f.status = 'PENDING'")
    List<Friendship> findPendingSent(@Param("userId") Long userId);

    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.requester.id = :a AND f.receiver.id = :b) OR " +
           "(f.requester.id = :b AND f.receiver.id = :a)) " +
           "AND f.status = 'ACCEPTED'")
    boolean areFriends(@Param("a") Long a, @Param("b") Long b);
}
