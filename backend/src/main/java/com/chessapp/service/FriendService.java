package com.chessapp.service;

import com.chessapp.dto.response.FriendResponse;
import com.chessapp.dto.response.UserSearchResponse;
import com.chessapp.enums.FriendshipStatus;
import com.chessapp.enums.NotificationType;
import com.chessapp.exception.BadRequestException;
import com.chessapp.exception.ConflictException;
import com.chessapp.exception.ForbiddenException;
import com.chessapp.exception.ResourceNotFoundException;
import com.chessapp.model.Friendship;
import com.chessapp.model.User;
import com.chessapp.repository.FriendshipRepository;
import com.chessapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository       userRepository;
    private final UserService          userService;
    private final NotificationService  notificationService;
    private final PresenceService      presenceService;

    @Transactional
    public FriendResponse sendFriendRequest(Long requesterId, String targetUsername) {
        User requester = userService.getUser(requesterId);
        User receiver  = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));

        if (requester.getId().equals(receiver.getId()))
            throw new BadRequestException("You cannot send a friend request to yourself");

        Optional<Friendship> existing = friendshipRepository.findBetween(requester, receiver);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (FriendshipStatus.ACCEPTED.equals(f.getStatus()))
                throw new ConflictException("You are already friends with " + targetUsername);
            if (FriendshipStatus.PENDING.equals(f.getStatus())) {
                if (f.getReceiver().getId().equals(requesterId))
                    return acceptFriendRequest(requesterId, f.getId());
                throw new ConflictException("Friend request already sent to " + targetUsername);
            }
        }

        Friendship friendship = friendshipRepository.save(
                Friendship.builder().requester(requester).receiver(receiver)
                        .status(FriendshipStatus.PENDING).build());

        notificationService.createAndSend(receiver.getId(), NotificationType.FRIEND_REQUEST,
                "New Friend Request",
                requester.getDisplayName() + " (@" + requester.getUsername() + ") sent you a friend request",
                "{\"friendshipId\":" + friendship.getId() + ",\"requesterId\":" + requesterId + "}");

        return FriendResponse.from(friendship, requesterId, presenceService.isOnline(receiver.getId()));
    }

    @Transactional
    public FriendResponse acceptFriendRequest(Long userId, Long friendshipId) {
        Friendship friendship = getOrThrow(friendshipId);
        if (!friendship.getReceiver().getId().equals(userId))
            throw new ForbiddenException("You cannot accept this friend request");
        if (!FriendshipStatus.PENDING.equals(friendship.getStatus()))
            throw new BadRequestException("This friend request is no longer pending");

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship = friendshipRepository.save(friendship);

        User acceptor = userService.getUser(userId);
        notificationService.createAndSend(friendship.getRequester().getId(),
                NotificationType.FRIEND_ACCEPTED, "Friend Request Accepted",
                acceptor.getDisplayName() + " accepted your friend request!",
                "{\"friendshipId\":" + friendshipId + ",\"userId\":" + userId + "}");

        return FriendResponse.from(friendship, userId,
                presenceService.isOnline(friendship.getRequester().getId()));
    }

    @Transactional
    public void declineFriendRequest(Long userId, Long friendshipId) {
        Friendship friendship = getOrThrow(friendshipId);
        if (!friendship.getReceiver().getId().equals(userId))
            throw new ForbiddenException("You cannot decline this friend request");
        if (!FriendshipStatus.PENDING.equals(friendship.getStatus()))
            throw new BadRequestException("This friend request is no longer pending");
        friendshipRepository.delete(friendship);
    }

    @Transactional
    public void removeFriend(Long userId, Long friendshipId) {
        Friendship friendship = getOrThrow(friendshipId);
        if (!friendship.involves(userId))
            throw new ForbiddenException("You are not part of this friendship");
        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(Long userId) {
        List<Friendship> friendships = friendshipRepository.findAcceptedFriends(userId);
        List<Long> ids = friendships.stream()
                .map(f -> f.getOtherUser(userId).getId()).collect(Collectors.toList());
        Set<Long> online = presenceService.getOnlineUserIds(ids);
        return friendships.stream()
                .map(f -> FriendResponse.from(f, userId,
                        online.contains(f.getOtherUser(userId).getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getPendingReceived(Long userId) {
        return friendshipRepository.findPendingReceived(userId).stream()
                .map(f -> FriendResponse.from(f, userId, presenceService.isOnline(f.getRequester().getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getPendingSent(Long userId) {
        return friendshipRepository.findPendingSent(userId).stream()
                .map(f -> FriendResponse.from(f, userId, presenceService.isOnline(f.getReceiver().getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchUsers(Long myUserId, String query) {
        if (query == null || query.trim().length() < 2)
            throw new BadRequestException("Search query must be at least 2 characters");

        User me = userService.getUser(myUserId);
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(myUserId))
                .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase())
                        || (u.getDisplayName() != null
                            && u.getDisplayName().toLowerCase().contains(query.toLowerCase())))
                .limit(20)
                .map(u -> {
                    String status = "NONE";
                    Optional<Friendship> f = friendshipRepository.findBetween(me, u);
                    if (f.isPresent()) {
                        Friendship fr = f.get();
                        if (FriendshipStatus.ACCEPTED.equals(fr.getStatus())) status = "ACCEPTED";
                        else if (FriendshipStatus.PENDING.equals(fr.getStatus()))
                            status = fr.getRequester().getId().equals(myUserId)
                                    ? "PENDING_SENT" : "PENDING_RECEIVED";
                        else status = fr.getStatus().name();
                    }
                    return UserSearchResponse.from(u, status, presenceService.isOnline(u.getId()));
                })
                .collect(Collectors.toList());
    }

    private Friendship getOrThrow(Long id) {
        return friendshipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship", id));
    }
}
