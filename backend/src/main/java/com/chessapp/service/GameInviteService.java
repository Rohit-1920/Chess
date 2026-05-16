package com.chessapp.service;

import com.chessapp.dto.request.SendGameInviteRequest;
import com.chessapp.dto.response.GameInviteResponse;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameTheme;
import com.chessapp.enums.InviteStatus;
import com.chessapp.enums.NotificationType;
import com.chessapp.exception.BadRequestException;
import com.chessapp.exception.ForbiddenException;
import com.chessapp.exception.ResourceNotFoundException;
import com.chessapp.model.Game;
import com.chessapp.model.GameInvite;
import com.chessapp.model.User;
import com.chessapp.repository.FriendshipRepository;
import com.chessapp.repository.GameInviteRepository;
import com.chessapp.repository.GameRepository;
import com.chessapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameInviteService {

    private final GameInviteRepository  inviteRepository;
    private final GameRepository        gameRepository;
    private final UserRepository        userRepository;
    private final UserService           userService;
    private final NotificationService   notificationService;
    private final FriendshipRepository  friendshipRepository;

    @Transactional
    public GameInviteResponse sendInvite(Long senderId, SendGameInviteRequest req) {
        User sender   = userService.getUser(senderId);
        User receiver = userRepository.findByUsername(req.getReceiverUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + req.getReceiverUsername()));

        if (sender.getId().equals(receiver.getId()))
            throw new BadRequestException("You cannot invite yourself");
        if (!friendshipRepository.areFriends(senderId, receiver.getId()))
            throw new BadRequestException("You must be friends with " + req.getReceiverUsername() + " to invite them");
        if (inviteRepository.pendingInviteExists(senderId, receiver.getId(), LocalDateTime.now()))
            throw new BadRequestException("You already have a pending invite to " + req.getReceiverUsername());

        GameTheme theme = req.getTheme() != null ? req.getTheme() : GameTheme.CLASSIC;
        GameInvite invite = inviteRepository.save(GameInvite.builder()
                .sender(sender).receiver(receiver).status(InviteStatus.PENDING)
                .message(req.getMessage()).theme(theme)
                .expiresAt(LocalDateTime.now().plusMinutes(10)).build());

        notificationService.createAndSend(receiver.getId(), NotificationType.GAME_INVITE,
                "Game Invite 🎯",
                sender.getDisplayName() + " invited you to a chess game!",
                "{\"inviteId\":" + invite.getId() + ",\"senderId\":" + senderId + "}");

        return GameInviteResponse.from(invite);
    }

    @Transactional
    public GameInviteResponse acceptInvite(Long userId, Long inviteId) {
        GameInvite invite = getOrThrow(inviteId);
        if (!invite.getReceiver().getId().equals(userId))
            throw new ForbiddenException("This invite is not for you");
        if (!invite.isPending())
            throw new BadRequestException(invite.isExpired() ? "This invite has expired" : "Invite is no longer pending");

        Game game = gameRepository.save(Game.builder()
                .gameMode(GameMode.ONLINE_MULTIPLAYER)
                .whitePlayer(invite.getSender()).blackPlayer(invite.getReceiver())
                .theme(invite.getTheme()).currentFen(Game.INITIAL_FEN).build());

        invite.setStatus(InviteStatus.ACCEPTED);
        invite.setGame(game);
        invite = inviteRepository.save(invite);

        User acceptor = userService.getUser(userId);
        notificationService.createAndSend(invite.getSender().getId(),
                NotificationType.GAME_INVITE_ACCEPTED, "Invite Accepted! 🎮",
                acceptor.getDisplayName() + " accepted your game invite. Game is starting!",
                "{\"inviteId\":" + inviteId + ",\"gameId\":" + game.getId() + "}");

        return GameInviteResponse.from(invite);
    }

    @Transactional
    public void declineInvite(Long userId, Long inviteId) {
        GameInvite invite = getOrThrow(inviteId);
        if (!invite.getReceiver().getId().equals(userId))
            throw new ForbiddenException("This invite is not for you");
        if (!InviteStatus.PENDING.equals(invite.getStatus()))
            throw new BadRequestException("This invite is no longer pending");

        invite.setStatus(InviteStatus.DECLINED);
        inviteRepository.save(invite);

        User decliner = userService.getUser(userId);
        notificationService.createAndSend(invite.getSender().getId(),
                NotificationType.GAME_INVITE_DECLINED, "Invite Declined",
                decliner.getDisplayName() + " declined your game invite.",
                "{\"inviteId\":" + inviteId + "}");
    }

    @Transactional
    public void cancelInvite(Long userId, Long inviteId) {
        GameInvite invite = getOrThrow(inviteId);
        if (!invite.getSender().getId().equals(userId))
            throw new ForbiddenException("You did not send this invite");
        if (!InviteStatus.PENDING.equals(invite.getStatus()))
            throw new BadRequestException("This invite cannot be cancelled");
        invite.setStatus(InviteStatus.CANCELLED);
        inviteRepository.save(invite);
    }

    @Transactional(readOnly = true)
    public List<GameInviteResponse> getMyInvites(Long userId) {
        return inviteRepository.findAllForUser(userId).stream()
                .map(GameInviteResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GameInviteResponse> getPendingReceived(Long userId) {
        return inviteRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, InviteStatus.PENDING)
                .stream().filter(i -> !i.isExpired())
                .map(GameInviteResponse::from).collect(Collectors.toList());
    }

    @Scheduled(fixedDelay = 120_000)
    @Transactional
    public void expireOldInvites() {
        int expired = inviteRepository.expireOldInvites(LocalDateTime.now());
        if (expired > 0) log.info("Expired {} game invites", expired);
    }

    private GameInvite getOrThrow(Long id) {
        return inviteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game invite", id));
    }
}
