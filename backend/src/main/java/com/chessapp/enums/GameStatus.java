package com.chessapp.enums;

public enum GameStatus {
    WAITING,       // Game created, waiting for second player (online multiplayer)
    IN_PROGRESS,   // Game is active
    COMPLETED,     // A player won
    DRAW,          // Game ended in a draw
    ABANDONED      // A player left / timed out
}
