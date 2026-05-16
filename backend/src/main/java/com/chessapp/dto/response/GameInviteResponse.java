package com.chessapp.dto.response;

import com.chessapp.enums.GameTheme;
import com.chessapp.enums.InviteStatus;
import com.chessapp.model.GameInvite;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GameInviteResponse {
    private Long id;
    private InviteStatus status;
    private String message;
    private GameTheme theme;
    private boolean expired;
    private SenderInfo sender;
    private SenderInfo receiver;
    private Long gameId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SenderInfo {
        private Long id;
        private String username;
        private String displayName;
        private String avatarUrl;
        private Integer rating;
    }

    public static GameInviteResponse from(GameInvite invite) {
        SenderInfo sender = SenderInfo.builder()
                .id(invite.getSender().getId())
                .username(invite.getSender().getUsername())
                .displayName(invite.getSender().getDisplayName())
                .avatarUrl(invite.getSender().getAvatarUrl())
                .rating(invite.getSender().getRating())
                .build();
        SenderInfo receiver = SenderInfo.builder()
                .id(invite.getReceiver().getId())
                .username(invite.getReceiver().getUsername())
                .displayName(invite.getReceiver().getDisplayName())
                .avatarUrl(invite.getReceiver().getAvatarUrl())
                .rating(invite.getReceiver().getRating())
                .build();
        return GameInviteResponse.builder()
                .id(invite.getId())
                .status(invite.getStatus())
                .message(invite.getMessage())
                .theme(invite.getTheme())
                .expired(invite.isExpired())
                .sender(sender)
                .receiver(receiver)
                .gameId(invite.getGame() != null ? invite.getGame().getId() : null)
                .expiresAt(invite.getExpiresAt())
                .createdAt(invite.getCreatedAt())
                .build();
    }
}
