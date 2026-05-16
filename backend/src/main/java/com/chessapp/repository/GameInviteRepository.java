package com.chessapp.repository;

import com.chessapp.enums.InviteStatus;
import com.chessapp.model.GameInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GameInviteRepository extends JpaRepository<GameInvite, Long> {

    List<GameInvite> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, InviteStatus status);

    List<GameInvite> findBySenderIdAndStatusOrderByCreatedAtDesc(Long senderId, InviteStatus status);

    @Query("SELECT i FROM GameInvite i WHERE " +
           "(i.sender.id = :userId OR i.receiver.id = :userId) " +
           "ORDER BY i.createdAt DESC")
    List<GameInvite> findAllForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE GameInvite i SET i.status = 'EXPIRED' WHERE " +
           "i.status = 'PENDING' AND i.expiresAt < :now")
    int expireOldInvites(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(i) > 0 FROM GameInvite i WHERE " +
           "i.sender.id = :senderId AND i.receiver.id = :receiverId " +
           "AND i.status = 'PENDING' AND i.expiresAt > :now")
    boolean pendingInviteExists(@Param("senderId") Long senderId,
                                @Param("receiverId") Long receiverId,
                                @Param("now") LocalDateTime now);
}
