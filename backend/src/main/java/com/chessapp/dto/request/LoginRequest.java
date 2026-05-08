package com.chessapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    /**
     * Can be an email address, phone number, or username.
     * The backend resolves whichever identifier is provided.
     */
    @NotBlank(message = "Identifier (email / phone / username) is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
