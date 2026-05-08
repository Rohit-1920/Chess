'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Share2, Crown } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { ChessBoardComponent } from '@/components/chess/ChessBoard'
import { MoveHistory } from '@/components/chess/MoveHistory'
import { PlayerCard } from '@/components/chess/PlayerCard'
import { GameControls } from '@/components/chess/GameControls'
import { ThemeSelector } from '@/components/chess/ThemeSelector'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
import { wsClient } from '@/lib/websocket'
import { gameApi } from '@/lib/api'
import { MoveResponse, GameTheme, WebSocketMessage } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = Number(params.id)

  const { user, accessToken, isAuthenticated } = useAuthStore()
  const { currentGame, moves, isAiThinking, loadGame, loadMoves, addMove, setGame, reset } = useGameStore()

  const [flipped, setFlipped]           = useState(false)
  const [theme, setTheme]               = useState<GameTheme>('CLASSIC')
  const [gameOverModal, setGameOverModal] = useState(false)
  const [chatInput, setChatInput]        = useState('')
  const [wsConnected, setWsConnected]    = useState(false)

  // ─── Load game ───────────────────────────────────────────────────
  useEffect(() => {
    reset()
    loadGame(gameId).catch(() => {
      toast.error('Game not found')
      router.push('/dashboard')
    })
    loadMoves(gameId)
  }, [gameId])

  // Set theme from game
  useEffect(() => {
    if (currentGame?.theme) setTheme(currentGame.theme)
    // Auto-flip if user plays black
    if (currentGame?.myColor === 'BLACK') setFlipped(true)
  }, [currentGame?.id])

  // ─── WebSocket (online games) ─────────────────────────────────────
  useEffect(() => {
    if (!currentGame) return
    if (currentGame.gameMode !== 'ONLINE_MULTIPLAYER') return
    if (!accessToken) return

    wsClient.connect(accessToken)
      .then(() => {
        setWsConnected(true)
        wsClient.subscribeToGame(gameId, handleWsMessage)
        wsClient.subscribeToErrors((msg) => toast.error(msg.message || 'Game error'))
      })
      .catch(() => toast.warning('Real-time connection failed — moves may be delayed'))

    return () => {
      wsClient.disconnect()
      setWsConnected(false)
    }
  }, [currentGame?.id, accessToken])

  // Show game over modal
  useEffect(() => {
    if (currentGame?.status === 'COMPLETED' || currentGame?.status === 'DRAW') {
      setGameOverModal(true)
    }
  }, [currentGame?.status])

  // ─── Handlers ────────────────────────────────────────────────────
  const handleWsMessage = (msg: WebSocketMessage) => {
    if (msg.type === 'MOVE_MADE') {
      const mv = msg.payload as MoveResponse
      addMove(mv)
      if (mv.aiMove) addMove(mv.aiMove)
    } else if (msg.type === 'GAME_OVER' || msg.type === 'GAME_STARTED') {
      setGame(msg.payload as any)
    }
  }

  const handleMoveMade = useCallback((mv: MoveResponse) => {
    addMove(mv)
    if (mv.aiMove) addMove(mv.aiMove)
    // Refresh full game state
    loadGame(gameId)
  }, [addMove, loadGame, gameId])

  const handleResign = async () => {
    try {
      const { data } = await gameApi.resign(gameId)
      setGame(data.data)
      toast.info('You resigned.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resign')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Game link copied!')
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    wsClient.sendChat(gameId, chatInput.trim())
    setChatInput('')
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cream/40">
          <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          Loading game…
        </div>
      </div>
    )
  }

  const isGameOver = ['COMPLETED', 'DRAW', 'ABANDONED'].includes(currentGame.status)
  const isMyTurnGeneral = currentGame.status === 'IN_PROGRESS'
  const sideToMove = currentGame.currentFen.split(' ')[1] === 'w' ? 'WHITE' : 'BLACK'

  const topPlayer    = flipped ? currentGame.whitePlayer : currentGame.blackPlayer
  const bottomPlayer = flipped ? currentGame.blackPlayer : currentGame.whitePlayer
  const topIsAi      = flipped ? currentGame.aiPlaysAs === 'WHITE' : currentGame.aiPlaysAs === 'BLACK'
  const bottomIsAi   = flipped ? currentGame.aiPlaysAs === 'BLACK' : currentGame.aiPlaysAs === 'WHITE'
  const topColor     = flipped ? 'WHITE' : 'BLACK'
  const bottomColor  = flipped ? 'BLACK' : 'WHITE'
  const topActive    = sideToMove === topColor && isMyTurnGeneral
  const bottomActive = sideToMove === bottomColor && isMyTurnGeneral

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 animate-fade-up">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-cream/40 hover:text-cream/70 transition-colors">
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              {wsConnected && (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
              <ThemeSelector selected={theme} onChange={setTheme} />
              <button onClick={handleShare} className="p-2 rounded-lg text-cream/30 hover:text-cream/60 hover:bg-surface-700 transition-all">
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">

            {/* Board column */}
            <div className="flex-1 max-w-[600px] mx-auto xl:mx-0 w-full animate-fade-up delay-100">
              {/* Top player */}
              <div className="mb-3">
                <PlayerCard
                  player={topPlayer}
                  color={topColor}
                  isActive={topActive}
                  isAi={topIsAi}
                  aiDifficulty={currentGame.aiDifficulty}
                  label={topColor === currentGame.myColor ? 'You' : undefined}
                />
              </div>

              {/* Board */}
              <ChessBoardComponent
                game={currentGame}
                moves={moves}
                onMoveMade={handleMoveMade}
                flipped={flipped}
                disabled={isGameOver || isAiThinking}
                theme={theme}
              />

              {/* Bottom player */}
              <div className="mt-3">
                <PlayerCard
                  player={bottomPlayer}
                  color={bottomColor}
                  isActive={bottomActive}
                  isAi={bottomIsAi}
                  aiDifficulty={currentGame.aiDifficulty}
                  label={bottomColor === currentGame.myColor ? 'You' : undefined}
                />
              </div>

              {/* Controls */}
              <div className="mt-3">
                <GameControls
                  gameId={gameId}
                  onResign={handleResign}
                  onFlipBoard={() => setFlipped(!flipped)}
                  canResign={!isGameOver && currentGame.status === 'IN_PROGRESS'}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:w-80 w-full flex flex-col gap-4 animate-fade-up delay-200">
              {/* Move history */}
              <div className="h-80 xl:h-[460px]">
                <MoveHistory moves={moves} currentFen={currentGame.currentFen} />
              </div>

              {/* Chat (online only) */}
              {currentGame.gameMode === 'ONLINE_MULTIPLAYER' && (
                <div className="bg-surface-900 rounded-xl border border-cream/[0.07] overflow-hidden">
                  <div className="px-4 py-3 border-b border-cream/[0.07]">
                    <span className="text-xs font-medium text-cream/40 uppercase tracking-widest">Chat</span>
                  </div>
                  <div className="p-3 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      placeholder="Say something…"
                      className="input-dark text-sm flex-1 py-2"
                    />
                    <button onClick={sendChat} className="px-3 py-2 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 text-sm transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Game info */}
              <div className="bg-surface-900 rounded-xl border border-cream/[0.07] p-4 space-y-2">
                <p className="text-xs text-cream/30 uppercase tracking-widest mb-3">Game Info</p>
                {[
                  ['Mode',       currentGame.gameMode.replace('_', ' ')],
                  ['Moves',      currentGame.moveCount],
                  ['Status',     currentGame.status.replace('_', ' ')],
                  ['Theme',      currentGame.theme],
                  ...(currentGame.aiDifficulty ? [['Difficulty', currentGame.aiDifficulty]] : []),
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-xs">
                    <span className="text-cream/30">{k}</span>
                    <span className="text-cream/60 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Game Over Modal */}
      <Modal isOpen={gameOverModal} onClose={() => setGameOverModal(false)} title="Game Over" size="sm">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center mx-auto">
            <Crown size={28} className="text-gold-400" />
          </div>

          {currentGame.status === 'COMPLETED' && (
            <>
              <p className="font-display text-2xl text-cream">
                {currentGame.winner?.id === user?.id ? '🎉 You Won!' : currentGame.winner ? `${currentGame.winner.displayName || currentGame.winner.username} wins` : 'Game Over'}
              </p>
              <p className="text-sm text-cream/40">
                {currentGame.winner?.id === user?.id
                  ? 'Excellent game. Your rating has been updated.'
                  : 'Better luck next time!'}
              </p>
            </>
          )}

          {currentGame.status === 'DRAW' && (
            <>
              <p className="font-display text-2xl text-cream">Draw!</p>
              <p className="text-sm text-cream/40">The game ended in a draw.</p>
            </>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="gold" onClick={() => { setGameOverModal(false); router.push('/dashboard') }} className="w-full">
              Back to Dashboard
            </Button>
            <Button variant="ghost" onClick={() => setGameOverModal(false)} className="w-full">
              Review Game
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
