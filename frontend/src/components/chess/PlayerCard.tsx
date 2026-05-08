'use client'
import { User, Clock } from 'lucide-react'
import { PlayerInfo } from '@/types'

interface PlayerCardProps {
  player?: PlayerInfo
  color: 'WHITE' | 'BLACK'
  isActive: boolean
  isAi?: boolean
  aiDifficulty?: string
  capturedPieces?: string[]
  label?: string   // "You" | "Opponent" | "White" | "Black"
}

const PIECE_VALUES: Record<string, number> = {
  '♙': 1, '♟': 1, '♘': 3, '♞': 3, '♗': 3, '♝': 3,
  '♖': 5, '♜': 5, '♕': 9, '♛': 9,
}

export function PlayerCard({
  player, color, isActive, isAi = false, aiDifficulty, label
}: PlayerCardProps) {
  const isWhite = color === 'WHITE'

  const difficultyColor = {
    EASY:   'text-emerald-400 bg-emerald-900/30 border-emerald-700/30',
    MEDIUM: 'text-amber-400 bg-amber-900/30 border-amber-700/30',
    HARD:   'text-red-400 bg-red-900/30 border-red-700/30',
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
      isActive
        ? 'bg-gold-500/10 border-gold-500/30 shadow-gold-sm'
        : 'bg-surface-800 border-cream/[0.07]'
    }`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isWhite ? 'bg-cream/10 border border-cream/20' : 'bg-surface-700 border border-cream/10'
        }`}>
          {player?.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={16} className={isWhite ? 'text-cream/60' : 'text-cream/40'} />
          )}
          {/* Online indicator */}
          {isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gold-400 border-2 border-surface-900 animate-pulse" />
          )}
        </div>

        {/* Name & rating */}
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isActive ? 'text-cream' : 'text-cream/70'}`}>
              {isAi ? `AI (${aiDifficulty || 'Medium'})` : (player?.displayName || player?.username || 'Guest')}
            </span>
            {label && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-cream/30 uppercase tracking-wider">
                {label}
              </span>
            )}
          </div>
          {player?.rating && (
            <span className="text-[11px] text-cream/30">{player.rating} ELO</span>
          )}
          {isAi && aiDifficulty && (
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium mt-0.5 ${
              difficultyColor[aiDifficulty as keyof typeof difficultyColor] || difficultyColor.MEDIUM
            }`}>
              {aiDifficulty}
            </span>
          )}
        </div>
      </div>

      {/* Turn indicator */}
      <div className="flex items-center gap-2">
        {isActive && (
          <div className="flex items-center gap-1.5 text-xs text-gold-400">
            <Clock size={12} className="animate-pulse" />
            <span>Your turn</span>
          </div>
        )}
        {/* Piece colour chip */}
        <div className={`w-5 h-5 rounded-full border-2 ${
          isWhite
            ? 'bg-cream border-cream/40'
            : 'bg-surface-900 border-cream/30'
        }`} title={isWhite ? 'White' : 'Black'} />
      </div>
    </div>
  )
}
