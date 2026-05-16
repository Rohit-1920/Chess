package com.chessapp.model;

import com.chessapp.enums.GameTheme;
import com.chessapp.enums.InviteStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_invites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InviteStatus status = InviteStatus.PENDING;

    @Column(name = "message", length = 255)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", length = 30)
    @Builder.Default
    private GameTheme theme = GameTheme.CLASSIC;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isPending() {
        return InviteStatus.PENDING.equals(status) && !isExpired();
    }
}
