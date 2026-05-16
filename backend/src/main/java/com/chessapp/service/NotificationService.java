package com.chessapp.service;

import com.chessapp.dto.response.NotificationResponse;
import com.chessapp.dto.response.WebSocketMessage;
import com.chessapp.enums.NotificationType;
import com.chessapp.exception.ResourceNotFoundException;
import com.chessapp.model.Notification;
import com.chessapp.model.User;
import com.chessapp.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate  messagingTemplate;
    private final UserService            userService;

    @Transactional
    public NotificationResponse createAndSend(Long recipientId, NotificationType type,
                                               String title, String message, String jsonData) {
        User recipient = userService.getUser(recipientId);
        Notification notification = Notification.builder()
                .recipient(recipient).type(type)
                .title(title).message(message).data(jsonData)
                .build();
        notification = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.from(notification);

        try {
            WebSocketMessage wsMsg = WebSocketMessage.builder()
                    .type(WebSocketMessage.Type.CHAT)
                    .payload(response).message("notification").build();
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(recipientId), "/queue/notifications", wsMsg);
        } catch (Exception e) {
            log.warn("Could not push real-time notification to {}: {}", recipientId, e.getMessage());
        }
        return response;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAll(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnread(Long userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(NotificationResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) throw new ResourceNotFoundException("Notification", notificationId);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }
}
