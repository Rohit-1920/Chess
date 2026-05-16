package com.chessapp.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RespondToInviteRequest {
    @NotNull(message = "accepted is required")
    private Boolean accepted;
}
