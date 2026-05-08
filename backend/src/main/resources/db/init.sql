-- ============================================================
-- Chess App — Database Initialisation Script
-- Run once on a fresh MySQL instance (Hibernate handles DDL)
-- This script creates the DB and user with correct permissions.
-- ============================================================

CREATE DATABASE IF NOT EXISTS chessdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'chessuser'@'%' IDENTIFIED BY 'chesspassword';
GRANT ALL PRIVILEGES ON chessdb.* TO 'chessuser'@'%';
FLUSH PRIVILEGES;

USE chessdb;

-- ─── Users Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE,
    phone         VARCHAR(20) UNIQUE,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    avatar_url    VARCHAR(500),
    rating        INT NOT NULL DEFAULT 1200,
    games_played  INT NOT NULL DEFAULT 0,
    games_won     INT NOT NULL DEFAULT 0,
    games_lost    INT NOT NULL DEFAULT 0,
    games_drawn   INT NOT NULL DEFAULT 0,
    preferred_theme VARCHAR(30) DEFAULT 'CLASSIC',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone),
    INDEX idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Games Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    white_player_id BIGINT,
    black_player_id BIGINT,
    game_mode       ENUM('AI','LOCAL_MULTIPLAYER','ONLINE_MULTIPLAYER') NOT NULL,
    ai_difficulty   ENUM('EASY','MEDIUM','HARD'),
    ai_plays_as     ENUM('WHITE','BLACK'),
    status          ENUM('WAITING','IN_PROGRESS','COMPLETED','DRAW','ABANDONED') NOT NULL DEFAULT 'WAITING',
    current_fen     TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    winner_id       BIGINT,
    theme           VARCHAR(30) NOT NULL DEFAULT 'CLASSIC',
    move_count      INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_games_white (white_player_id),
    INDEX idx_games_black (black_player_id),
    INDEX idx_games_status (status),
    INDEX idx_games_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Moves Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moves (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id         BIGINT NOT NULL,
    player_id       BIGINT,
    move_number     INT NOT NULL,
    from_square     VARCHAR(2) NOT NULL,
    to_square       VARCHAR(2) NOT NULL,
    promotion_piece VARCHAR(10),
    san_notation    VARCHAR(10),
    fen_after_move  TEXT NOT NULL,
    is_ai_move      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moves_game (game_id),
    INDEX idx_moves_game_number (game_id, move_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Foreign Keys ──────────────────────────────────────────
ALTER TABLE games
    ADD CONSTRAINT fk_games_white FOREIGN KEY (white_player_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_games_black FOREIGN KEY (black_player_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_games_winner FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE moves
    ADD CONSTRAINT fk_moves_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_moves_player FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET NULL;
