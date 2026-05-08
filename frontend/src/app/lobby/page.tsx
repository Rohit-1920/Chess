'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Globe } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { LobbyCard } from '@/components/game/LobbyCard'
import { CreateGameModal } from '@/components/game/CreateGameModal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { gameApi } from '@/lib/api'
import { GameResponse } from '@/types'
import { toast } from 'sonner'

export default function LobbyPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [games, setGames]         = useState<GameResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadLobby = async () => {
    setLoading(true)
    try {
      const { data } = await gameApi.getLobby()
      setGames(data.data || [])
    } catch (_) {
      toast.error('Failed to load lobby')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLobby()
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadLobby, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Globe size={18} className="text-sky-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-cream">Game Lobby</h1>
              <p className="text-cream/40 text-sm">Join an open game or create your own</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLobby}
              className="p-2 rounded-lg text-cream/30 hover:text-cream/60 hover:bg-surface-700 transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            {isAuthenticated() && (
              <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}>
                <Plus size={14} />
                Create Game
              </Button>
            )}
          </div>
        </div>

        {/* Live count */}
        <div className="flex items-center gap-2 mb-6 animate-fade-up delay-100">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-sm text-cream/40">
            {games.length} open {games.length === 1 ? 'game' : 'games'} waiting
          </span>
        </div>

        {/* Games list */}
        <div className="space-y-3 animate-fade-up delay-200">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800 animate-pulse" />
            ))
          ) : games.length > 0 ? (
            games.map((game) => (
              <LobbyCard key={game.id} game={game} myUserId={user?.id} />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center border border-dashed border-cream/[0.07] rounded-2xl">
              <Globe size={36} className="text-cream/10 mb-4" />
              <p className="text-cream/30">No open games right now.</p>
              <p className="text-cream/20 text-sm mt-1">Be the first — create a game!</p>
              {isAuthenticated() && (
                <Button variant="gold" size="sm" onClick={() => setShowCreate(true)} className="mt-6">
                  <Plus size={14} />
                  Create Game
                </Button>
              )}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-12 p-6 rounded-2xl bg-surface-900 border border-cream/[0.06] animate-fade-up delay-300">
          <h3 className="font-display text-lg text-cream mb-4">How online play works</h3>
          <ol className="space-y-3">
            {[
              'Sign in and click "Create Game" to open a new online game.',
              'Share the game link or wait in the lobby for someone to join.',
              'Moves are synced in real-time over WebSocket — no refreshing needed.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-cream/50">
                <span className="w-5 h-5 rounded-full bg-surface-700 border border-cream/10 flex items-center justify-center flex-shrink-0 text-xs text-gold-500/70 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </main>

      <CreateGameModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
