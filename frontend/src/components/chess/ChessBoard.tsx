'use client'
import { useState, useCallback, useEffect } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess, Square } from 'chess.js'
import { Brain } from 'lucide-react'
import { GameResponse, GameTheme, MoveResponse } from '@/types'
import { getTheme } from '@/lib/chess-themes'
import { gameApi } from '@/lib/api'
import { useGameStore } from '@/store/gameStore'
import { toast } from 'sonner'

interface ChessBoardProps {
  game: GameResponse
  moves: MoveResponse[]
  onMoveMade?: (move: MoveResponse) => void
  flipped?: boolean
  disabled?: boolean   // spectator / game over
  theme: GameTheme
}

type SquareStyles = Record<string, React.CSSProperties>

export function ChessBoardComponent({
  game, moves, onMoveMade, flipped = false, disabled = false, theme
}: ChessBoardProps) {
  const themeConfig = getTheme(theme)
  const { setAiThinking, isAiThinking } = useGameStore()

  const [chess]             = useState(() => new Chess())
  const [selectedSq, setSelectedSq] = useState<Square | null>(null)
  const [optionSquares, setOptionSquares] = useState<SquareStyles>({})
  const [lastMoveSquares, setLastMoveSquares] = useState<SquareStyles>({})
  const [checkSquare, setCheckSquare] = useState<SquareStyles>({})
  const [promoOpen, setPromoOpen] = useState<{ from: Square; to: Square } | null>(null)

  // Sync chess.js with the server FEN
  useEffect(() => {
    try {
      chess.load(game.currentFen)
    } catch (_) {}
    // Highlight last move
    if (moves.length > 0) {
      const last = moves[moves.length - 1]
      const sq: SquareStyles = {}
      sq[last.fromSquare] = { background: 'rgba(232,180,35,0.35)' }
      sq[last.toSquare]   = { background: 'rgba(232,180,35,0.55)' }
      setLastMoveSquares(sq)
    }
    // Highlight check
    if (chess.inCheck()) {
      const kingSq = findKingSquare(chess)
      if (kingSq) {
        setCheckSquare({ [kingSq]: { background: 'rgba(220,38,38,0.55)', borderRadius: '50%' } })
      }
    } else {
      setCheckSquare({})
    }
  }, [game.currentFen, moves])

  // ─── Move Attempt ───────────────────────────────────────────────

  const attemptMove = useCallback(async (from: Square, to: Square, promotion?: string) => {
    if (disabled) return
    if (!isMyTurn()) return

    // Local validation first (chess.js)
    const legalMoves = chess.moves({ square: from, verbose: true })
    const isLegal = legalMoves.some((m) => m.to === to)
    if (!isLegal) {
      setSelectedSq(null)
      setOptionSquares({})
      return
    }

    // Promotion detection
    const needsPromo = legalMoves.some(
      (m) => m.to === to && m.flags.includes('p')
    )
    if (needsPromo && !promotion) {
      setPromoOpen({ from, to })
      return
    }

    setSelectedSq(null)
    setOptionSquares({})

    try {
      if (game.gameMode === 'AI') setAiThinking(true)

      const { data } = await gameApi.makeMove(game.id, {
        fromSquare: from,
        toSquare: to,
        promotionPiece: promotion,
      })

      const result: MoveResponse = data.data
      onMoveMade?.(result)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Illegal move'
      toast.error(msg)
      setAiThinking(false)
    }
  }, [game, disabled, chess, onMoveMade, setAiThinking])

  // ─── Square Click ───────────────────────────────────────────────

  const onSquareClick = useCallback((sq: Square) => {
    if (disabled || !isMyTurn()) return

    if (selectedSq) {
      if (sq === selectedSq) {
        // Deselect
        setSelectedSq(null)
        setOptionSquares({})
        return
      }
      // Try to move
      attemptMove(selectedSq, sq)
    } else {
      // Select if own piece
      const piece = chess.get(sq)
      const myColor = game.myColor === 'WHITE' ? 'w' : 'b'

      // For local multiplayer, allow whoever's turn it is
      const turnColor = chess.turn()
      if (!piece) return
      if (game.gameMode !== 'LOCAL_MULTIPLAYER' && piece.color !== myColor) return
      if (game.gameMode === 'LOCAL_MULTIPLAYER' && piece.color !== turnColor) return

      setSelectedSq(sq)

      // Show legal move indicators
      const legalMoves = chess.moves({ square: sq, verbose: true })
      const dots: SquareStyles = {}
      legalMoves.forEach((m) => {
        dots[m.to] = {
          background: chess.get(m.to)
            ? 'radial-gradient(circle, rgba(232,180,35,0.6) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(232,180,35,0.4) 30%, transparent 30%)',
          borderRadius: '50%',
        }
      })
      dots[sq] = { background: 'rgba(232,180,35,0.3)' }
      setOptionSquares(dots)
    }
  }, [selectedSq, chess, game, disabled, attemptMove])

  // ─── Drag & Drop ────────────────────────────────────────────────

  const onPieceDrop = useCallback((from: Square, to: Square, piece: string): boolean => {
    if (disabled || !isMyTurn()) return false
    attemptMove(from, to)
    return true
  }, [disabled, attemptMove])

  // ─── Helpers ────────────────────────────────────────────────────

  const isMyTurn = (): boolean => {
    if (game.status !== 'IN_PROGRESS') return false
    const turn = chess.turn() === 'w' ? 'WHITE' : 'BLACK'

    if (game.gameMode === 'LOCAL_MULTIPLAYER') return true
    if (game.gameMode === 'AI') {
      return turn !== game.aiPlaysAs
    }
    return turn === game.myColor
  }

  const combinedStyles: SquareStyles = {
    ...lastMoveSquares,
    ...optionSquares,
    ...checkSquare,
  }

  const boardOrientation = flipped ? 'black' : 'white'

  return (
    <div className="relative">
      {/* AI thinking overlay */}
      {isAiThinking && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-900/90 border border-gold-500/30 backdrop-blur-sm shadow-gold">
            <Brain size={18} className="text-gold-400 animate-pulse" />
            <span className="text-sm text-gold-400 font-medium">AI is thinking…</span>
            <div className="flex gap-1">
              {[0,1,2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gold-400"
                  style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotion modal */}
      {promoOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-gold-500/30 rounded-xl p-4 shadow-board">
            <p className="text-xs text-cream/50 text-center mb-3 uppercase tracking-wider">Promote pawn to</p>
            <div className="flex gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((p) => {
                const icons: Record<string, string> = { q: '♛', r: '♜', b: '♝', n: '♞' }
                const isWhiteTurn = chess.turn() === 'w'
                const whiteIcons: Record<string, string> = { q: '♕', r: '♖', b: '♗', n: '♘' }
                return (
                  <button
                    key={p}
                    onClick={() => {
                      const { from, to } = promoOpen
                      setPromoOpen(null)
                      attemptMove(from, to, p)
                    }}
                    className="w-12 h-12 rounded-lg bg-surface-700 hover:bg-gold-500/20 border border-cream/10 hover:border-gold-500/40 text-2xl transition-all flex items-center justify-center"
                  >
                    {isWhiteTurn ? whiteIcons[p] : icons[p]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* The board */}
      <div className="rounded-xl overflow-hidden shadow-board">
        <Chessboard
          position={game.currentFen}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          boardOrientation={boardOrientation}
          customSquareStyles={combinedStyles}
          customDarkSquareStyle={{ backgroundColor: themeConfig.darkSquare }}
          customLightSquareStyle={{ backgroundColor: themeConfig.lightSquare }}
          customBoardStyle={{
            borderRadius: '8px',
            ...themeConfig.boardStyle,
          }}
          arePiecesDraggable={!disabled && isMyTurn()}
          animationDuration={180}
        />
      </div>
    </div>
  )
}

// ─── Utility ─────────────────────────────────────────────────────

function findKingSquare(chess: Chess): Square | null {
  const board = chess.board()
  const turn = chess.turn()
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === turn) {
        return cell.square as Square
      }
    }
  }
  return null
}
