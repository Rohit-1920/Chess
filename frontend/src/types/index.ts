// ─── Enums ────────────────────────────────────────────────────────────────────

export type GameMode = 'AI' | 'LOCAL_MULTIPLAYER' | 'ONLINE_MULTIPLAYER'
export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'DRAW' | 'ABANDONED'
export type AiDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type GameTheme = 'CLASSIC' | 'DARK' | 'NEON' | 'WOOD' | 'MARBLE' | 'OCEAN' | 'FOREST'
export type PieceColor = 'WHITE' | 'BLACK'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number
  username: string
  displayName: string
  email?: string
  phone?: string
  avatarUrl?: string
  rating: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesDrawn: number
  preferredTheme: GameTheme
  createdAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserProfile
}

// ─── Game ─────────────────────────────────────────────────────────────────────

export interface PlayerInfo {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  rating: number
}

export interface GameResponse {
  id: number
  gameMode: GameMode
  status: GameStatus
  aiDifficulty?: AiDifficulty
  aiPlaysAs?: PieceColor
  theme: GameTheme
  currentFen: string
  moveCount: number
  whitePlayer?: PlayerInfo
  blackPlayer?: PlayerInfo
  winner?: PlayerInfo
  myColor?: PieceColor
  createdAt: string
  updatedAt: string
}

// ─── Move ─────────────────────────────────────────────────────────────────────

export interface MoveResponse {
  id: number
  moveNumber: number
  fromSquare: string
  toSquare: string
  promotionPiece?: string
  sanNotation?: string
  uci: string
  fenAfterMove: string
  isAiMove: boolean
  playerId?: number
  playerUsername?: string
  createdAt: string
  game?: GameResponse
  aiMove?: MoveResponse
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WebSocketMessageType =
  | 'GAME_STARTED'
  | 'MOVE_MADE'
  | 'GAME_OVER'
  | 'PLAYER_JOINED'
  | 'PLAYER_DISCONNECTED'
  | 'CHAT'
  | 'ERROR'

export interface WebSocketMessage {
  type: WebSocketMessageType
  payload?: MoveResponse | GameResponse | string
  message?: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  timestamp: string
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface RegisterForm {
  email?: string
  phone?: string
  username: string
  password: string
  displayName?: string
}

export interface LoginForm {
  identifier: string
  password: string
}

export interface CreateGameForm {
  gameMode: GameMode
  aiDifficulty?: AiDifficulty
  aiPlaysAs?: PieceColor
  theme?: GameTheme
  opponentUsername?: string
}

// ─── Theme Config ─────────────────────────────────────────────────────────────

export interface ThemeConfig {
  id: GameTheme
  label: string
  lightSquare: string
  darkSquare: string
  boardStyle?: Record<string, string>
  preview: string
}
