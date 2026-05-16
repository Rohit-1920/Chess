package com.chessapp.dto.request;

import com.chessapp.enums.GameTheme;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendGameInviteRequest {
    @NotBlank(message = "Receiver username is required")
    private String receiverUsername;

    @Size(max = 255)
    private String message;

    private GameTheme theme;
}
