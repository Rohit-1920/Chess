'use client'
import Link from 'next/link'
import { Bot, Users, Globe, Crown, Minus, X, ChevronRight } from 'lucide-react'
import { GameResponse } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface GameCardProps {
  game: GameResponse
  userId?: number
}

export function GameCard({ game, userId }: GameCardProps) {
  const modeIcon  = { AI: Bot, LOCAL_MULTIPLAYER: Users, ONLINE_MULTIPLAYER: Globe }
  const ModeIcon  = modeIcon[game.gameMode]

  const statusLabel = {
    WAITING:     { text: 'Waiting',     cls: 'text-sky-400 bg-sky-900/20 border-sky-700/30' },
    IN_PROGRESS: { text: 'Live',        cls: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30 animate-pulse' },
    COMPLETED:   { text: 'Completed',   cls: 'text-cream/40 bg-surface-700 border-cream/10' },
    DRAW:        { text: 'Draw',        cls: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
    ABANDONED:   { text: 'Abandoned',   cls: 'text-red-400/60 bg-red-900/10 border-red-700/20' },
  }[game.status]

  // Outcome from current user's perspective
  let outcome: 'win' | 'loss' | 'draw' | null = null
  if (userId && game.status === 'COMPLETED') {
    outcome = game.winner?.id === userId ? 'win' : 'loss'
  } else if (game.status === 'DRAW') {
    outcome = 'draw'
  }

  const outcomeStyle = {
    win:  { icon: Crown, color: 'text-gold-400' },
    loss: { icon: X,     color: 'text-red-400' },
    draw: { icon: Minus, color: 'text-cream/40' },
  }

  return (
    <Link
      href={`/game/${game.id}`}
      className="flex items-center gap-4 p-4 rounded-xl bg-surface-800 border border-cream/[0.07] hover:border-cream/[0.15] hover:bg-surface-700 transition-all duration-200 group"
    >
      {/* Mode icon */}
      <div className="w-10 h-10 rounded-xl bg-surface-700 border border-cream/[0.08] flex items-center justify-center flex-shrink-0">
        <ModeIcon size={16} className="text-cream/40" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-cream truncate">
            {game.gameMode === 'AI'
              ? `vs AI (${game.aiDifficulty || 'Medium'})`
              : `${game.whitePlayer?.username ?? '?'} vs ${game.blackPlayer?.username ?? '?'}`
            }
          </span>
          {outcome && (() => {
            const { icon: Icon, color } = outcomeStyle[outcome]
            return <Icon size={13} className={color} />
          })()}
        </div>
        <div className="flex items-center gap-3 text-xs text-cream/30">
          <span>{game.moveCount} moves</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] px-2 py-1 rounded-lg border font-medium uppercase tracking-wider ${statusLabel.cls}`}>
          {statusLabel.text}
        </span>
        <ChevronRight size={14} className="text-cream/20 group-hover:text-cream/40 transition-colors" />
      </div>
    </Link>
  )
}
