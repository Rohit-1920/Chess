package com.chessapp.dto.response;

import com.chessapp.enums.GameTheme;
import com.chessapp.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String phone;
    private String avatarUrl;
    private Integer rating;
    private Integer gamesPlayed;
    private Integer gamesWon;
    private Integer gamesLost;
    private Integer gamesDrawn;
    private GameTheme preferredTheme;
    private LocalDateTime createdAt;

    public static UserProfileResponse from(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .rating(user.getRating())
                .gamesPlayed(user.getGamesPlayed())
                .gamesWon(user.getGamesWon())
                .gamesLost(user.getGamesLost())
                .gamesDrawn(user.getGamesDrawn())
                .preferredTheme(user.getPreferredTheme())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
