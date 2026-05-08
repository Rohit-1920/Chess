package com.chessapp.model;

import com.chessapp.enums.GameTheme;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "phone"),
                @UniqueConstraint(columnNames = "username")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "rating", nullable = false)
    @Builder.Default
    private Integer rating = 1200;

    @Column(name = "games_played", nullable = false)
    @Builder.Default
    private Integer gamesPlayed = 0;

    @Column(name = "games_won", nullable = false)
    @Builder.Default
    private Integer gamesWon = 0;

    @Column(name = "games_lost", nullable = false)
    @Builder.Default
    private Integer gamesLost = 0;

    @Column(name = "games_drawn", nullable = false)
    @Builder.Default
    private Integer gamesDrawn = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_theme", length = 30)
    @Builder.Default
    private GameTheme preferredTheme = GameTheme.CLASSIC;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ─── Helpers ───────────────────────────────────────────────

    /**
     * Returns whatever identifier was used to register —
     * email takes priority, then phone, then username.
     */
    public String getPrimaryIdentifier() {
        if (email != null && !email.isBlank()) return email;
        if (phone != null && !phone.isBlank()) return phone;
        return username;
    }
}
