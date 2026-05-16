package com.chessapp.dto.response;

import com.chessapp.enums.FriendshipStatus;
import com.chessapp.model.Friendship;
import com.chessapp.model.User;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FriendResponse {
    private Long friendshipId;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Integer rating;
    private FriendshipStatus status;
    private boolean isOnline;
    private boolean iRequested;
    private LocalDateTime friendsSince;
    private LocalDateTime createdAt;

    public static FriendResponse from(Friendship f, Long myUserId, boolean isOnline) {
        User other = f.getOtherUser(myUserId);
        return FriendResponse.builder()
                .friendshipId(f.getId())
                .userId(other.getId())
                .username(other.getUsername())
                .displayName(other.getDisplayName())
                .avatarUrl(other.getAvatarUrl())
                .rating(other.getRating())
                .status(f.getStatus())
                .isOnline(isOnline)
                .iRequested(f.getRequester().getId().equals(myUserId))
                .friendsSince(FriendshipStatus.ACCEPTED.equals(f.getStatus()) ? f.getUpdatedAt() : null)
                .createdAt(f.getCreatedAt())
                .build();
    }
}
