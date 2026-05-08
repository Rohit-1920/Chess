import { create } from 'zustand'
import { GameResponse, MoveResponse, WebSocketMessage } from '@/types'
import { gameApi } from '@/lib/api'
import { wsClient } from '@/lib/websocket'

interface ChatMessage {
  sender: string
  message: string
  timestamp: Date
}

interface GameState {
  currentGame: GameResponse | null
  moves: MoveResponse[]
  chatMessages: ChatMessage[]
  isLoading: boolean
  isAiThinking: boolean
  selectedSquare: string | null
  legalMoves: string[]
  promotionPending: { from: string; to: string } | null

  // Actions
  loadGame: (gameId: number) => Promise<void>
  loadMoves: (gameId: number) => Promise<void>
  setGame: (game: GameResponse) => void
  addMove: (move: MoveResponse) => void
  addChatMessage: (sender: string, message: string) => void
  setSelectedSquare: (square: string | null) => void
  setLegalMoves: (moves: string[]) => void
  setAiThinking: (v: boolean) => void
  setPromotionPending: (v: { from: string; to: string } | null) => void
  handleWebSocketMessage: (msg: WebSocketMessage) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  moves: [],
  chatMessages: [],
  isLoading: false,
  isAiThinking: false,
  selectedSquare: null,
  legalMoves: [],
  promotionPending: null,

  loadGame: async (gameId) => {
    set({ isLoading: true })
    try {
      const { data } = await gameApi.getGame(gameId)
      set({ currentGame: data.data, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  loadMoves: async (gameId) => {
    try {
      const { data } = await gameApi.getMoves(gameId)
      set({ moves: data.data || [] })
    } catch (_) {}
  },

  setGame: (game) => set({ currentGame: game }),

  addMove: (move) =>
    set((state) => ({
      moves: [...state.moves, move],
      currentGame: move.game ? { ...state.currentGame!, ...move.game } : state.currentGame,
      isAiThinking: false,
    })),

  addChatMessage: (sender, message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { sender, message, timestamp: new Date() },
      ],
    })),

  setSelectedSquare: (square) => set({ selectedSquare: square }),
  setLegalMoves: (moves) => set({ legalMoves: moves }),
  setAiThinking: (v) => set({ isAiThinking: v }),
  setPromotionPending: (v) => set({ promotionPending: v }),

  handleWebSocketMessage: (msg: WebSocketMessage) => {
    const { type, payload, message } = msg

    switch (type) {
      case 'MOVE_MADE': {
        const moveRes = payload as MoveResponse
        get().addMove(moveRes)
        // If AI also moved, add that too
        if (moveRes.aiMove) {
          get().addMove(moveRes.aiMove)
        }
        break
      }
      case 'GAME_STARTED':
      case 'GAME_OVER': {
        const game = payload as GameResponse
        set({ currentGame: game })
        break
      }
      case 'CHAT': {
        const text = payload as string
        get().addChatMessage(message || 'Player', text)
        break
      }
      case 'ERROR':
        console.error('[WS Game Error]:', message)
        break
      default:
        break
    }
  },

  reset: () =>
    set({
      currentGame: null,
      moves: [],
      chatMessages: [],
      isLoading: false,
      isAiThinking: false,
      selectedSquare: null,
      legalMoves: [],
      promotionPending: null,
    }),
}))
