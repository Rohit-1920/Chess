package com.chessapp.enums;

public enum GameMode {
    AI,                  // User vs AI (Ollama)
    LOCAL_MULTIPLAYER,   // Two players, same device/screen
    ONLINE_MULTIPLAYER   // Two signed-in users over WebSocket
}
