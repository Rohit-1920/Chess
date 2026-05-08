'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Swords, TrendingUp, Clock, Trophy, BarChart2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { CreateGameModal } from '@/components/game/CreateGameModal'
import { GameCard } from '@/components/game/GameCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { gameApi } from '@/lib/api'
import { GameResponse } from '@/types'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router  = useRouter()
  const { user, isAuthenticated, refreshProfile } = useAuthStore()

  const [games, setGames]       = useState<GameResponse[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      // Allow guest, but limited functionality
    }
    refreshProfile()
    loadGames()
  }, [])

  const loadGames = async () => {
    setLoading(true)
    try {
      const { data } = await gameApi.getMyGames(0, 10)
      setGames(data.data || [])
    } catch (_) {
      // guests won't have games
    } finally {
      setLoading(false)
    }
  }

  const activeGames  = games.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'WAITING')
  const finishedGames = games.filter((g) => ['COMPLETED', 'DRAW', 'ABANDONED'].includes(g.status))

  const stats = user ? [
    { label: 'Rating',      value: user.rating,      icon: TrendingUp, color: 'text-gold-400' },
    { label: 'Wins',        value: user.gamesWon,     icon: Trophy,    color: 'text-emerald-400' },
    { label: 'Games',       value: user.gamesPlayed,  icon: BarChart2, color: 'text-sky-400' },
    { label: 'Win Rate',    value: user.gamesPlayed > 0 ? `${Math.round(user.gamesWon / user.gamesPlayed * 100)}%` : '—', icon: Clock, color: 'text-purple-400' },
  ] : []

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 animate-fade-up">
          <div>
            <h1 className="font-display text-4xl text-cream mb-1">
              {user ? `Welcome back, ${user.displayName || user.username}` : 'Welcome'}
            </h1>
            <p className="text-cream/40 text-sm">Ready for your next match?</p>
          </div>
          <Button variant="gold" size="lg" onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            New Game
          </Button>
        </div>

        {/* Stats row */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fade-up delay-100">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-5 rounded-2xl bg-surface-900 border border-cream/[0.07] hover:border-cream/[0.12] transition-colors">
                <div className={`${color} mb-2`}><Icon size={18} /></div>
                <p className="text-2xl font-display text-cream">{value}</p>
                <p className="text-xs text-cream/40 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick play */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 animate-fade-up delay-200">
          {[
            { label: 'vs AI (Easy)',    mode: 'AI',               diff: 'EASY',   color: 'from-emerald-900/20 to-transparent border-emerald-700/20 hover:border-emerald-600/40' },
            { label: 'vs AI (Hard)',    mode: 'AI',               diff: 'HARD',   color: 'from-red-900/20 to-transparent border-red-700/20 hover:border-red-600/40' },
            { label: 'Local 2-Player',  mode: 'LOCAL_MULTIPLAYER', diff: null,    color: 'from-sky-900/20 to-transparent border-sky-700/20 hover:border-sky-600/40' },
          ].map(({ label, mode, diff, color }) => (
            <button
              key={label}
              onClick={async () => {
                try {
                  const { data } = await gameApi.createGame({
                    gameMode: mode as any,
                    aiDifficulty: diff as any,
                    theme: user?.preferredTheme || 'CLASSIC',
                  })
                  router.push(`/game/${data.data.id}`)
                } catch (_) {
                  setShowCreate(true)
                }
              }}
              className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${color} border transition-all duration-200 group text-left`}
            >
              <Swords size={16} className="text-cream/40 group-hover:text-cream/60 flex-shrink-0" />
              <span className="text-sm font-medium text-cream/70 group-hover:text-cream">{label}</span>
            </button>
          ))}
        </div>

        {/* Active Games */}
        {activeGames.length > 0 && (
          <div className="mb-10 animate-fade-up delay-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-display text-xl text-cream">Active Games</h2>
            </div>
            <div className="space-y-3">
              {activeGames.map((g) => (
                <GameCard key={g.id} game={g} userId={user?.id} />
              ))}
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="animate-fade-up delay-400">
          <h2 className="font-display text-xl text-cream mb-4">Recent Games</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-800 animate-pulse" />
              ))}
            </div>
          ) : finishedGames.length > 0 ? (
            <div className="space-y-3">
              {finishedGames.map((g) => (
                <GameCard key={g.id} game={g} userId={user?.id} />
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-cream/[0.08] rounded-2xl">
              <Swords size={32} className="text-cream/10 mb-3" />
              <p className="text-cream/30 text-sm">No games yet.</p>
              <p className="text-cream/20 text-xs mt-1">Click "New Game" to start playing.</p>
            </div>
          )}
        </div>
      </main>

      <CreateGameModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
