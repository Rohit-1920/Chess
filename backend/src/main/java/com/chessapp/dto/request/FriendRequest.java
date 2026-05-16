package com.chessapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FriendRequest {
    @NotBlank(message = "Username is required")
    private String username;
}
