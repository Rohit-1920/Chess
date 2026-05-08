package com.chessapp.dto.request;

import com.chessapp.enums.GameTheme;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username may only contain letters, digits, underscores, dots, and hyphens")
    private String username;

    @Size(max = 100, message = "Display name must be at most 100 characters")
    private String displayName;

    @Size(max = 500, message = "Avatar URL must be at most 500 characters")
    private String avatarUrl;

    /** Preferred board/game theme */
    private GameTheme preferredTheme;
}
