package com.chessapp.dto.response;

import com.chessapp.model.User;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserSearchResponse {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Integer rating;
    private boolean isOnline;
    private String friendshipStatus;

    public static UserSearchResponse from(User user, String friendshipStatus, boolean isOnline) {
        return UserSearchResponse.builder()
                .id(user.getId()).username(user.getUsername())
                .displayName(user.getDisplayName()).avatarUrl(user.getAvatarUrl())
                .rating(user.getRating()).isOnline(isOnline)
                .friendshipStatus(friendshipStatus).build();
    }
}
