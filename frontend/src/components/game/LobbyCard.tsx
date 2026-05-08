'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Swords } from 'lucide-react'
import { GameResponse } from '@/types'
import { gameApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface LobbyCardProps {
  game: GameResponse
  myUserId?: number
}

export function LobbyCard({ game, myUserId }: LobbyCardProps) {
  const router  = useRouter()
  const [joining, setJoining] = useState(false)
  const isOwner = game.whitePlayer?.id === myUserId

  const handleJoin = async () => {
    setJoining(true)
    try {
      await gameApi.joinGame(game.id)
      toast.success('Joined game!')
      router.push(`/game/${game.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not join game')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-800 border border-cream/[0.07] hover:border-cream/[0.12] transition-all">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-surface-700 border border-cream/10 flex items-center justify-center flex-shrink-0">
        {game.whitePlayer?.avatarUrl
          ? <img src={game.whitePlayer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          : <User size={16} className="text-cream/30" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream">
          {game.whitePlayer?.displayName || game.whitePlayer?.username || 'Anonymous'}
        </p>
        <div className="flex items-center gap-2 text-xs text-cream/30 mt-0.5">
          <span>{game.whitePlayer?.rating ?? '?'} ELO</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Waiting pulse */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-sky-400/70">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        Waiting
      </div>

      {/* Action */}
      {isOwner ? (
        <span className="text-xs text-cream/30 px-3 py-1.5 rounded-lg border border-cream/[0.06]">Your game</span>
      ) : (
        <Button size="sm" variant="gold" loading={joining} onClick={handleJoin}>
          <Swords size={12} />
          Join
        </Button>
      )}
    </div>
  )
}
