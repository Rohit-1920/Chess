'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Users, Globe, ChevronRight, Swords } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ThemeSelector } from '@/components/chess/ThemeSelector'
import { gameApi } from '@/lib/api'
import { GameMode, AiDifficulty, GameTheme } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [mode, setMode]               = useState<GameMode>('AI')
  const [difficulty, setDifficulty]   = useState<AiDifficulty>('MEDIUM')
  const [aiColor, setAiColor]         = useState<'WHITE' | 'BLACK'>('BLACK')
  const [theme, setTheme]             = useState<GameTheme>(user?.preferredTheme || 'CLASSIC')
  const [opponent, setOpponent]       = useState('')
  const [loading, setLoading]         = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const { data } = await gameApi.createGame({
        gameMode: mode,
        aiDifficulty: mode === 'AI' ? difficulty : undefined,
        aiPlaysAs: mode === 'AI' ? aiColor : undefined,
        theme,
        opponentUsername: mode === 'ONLINE_MULTIPLAYER' && opponent ? opponent : undefined,
      })
      toast.success('Game created!')
      onClose()
      router.push(`/game/${data.data.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    { id: 'AI' as GameMode,               icon: Bot,    label: 'vs AI',        desc: 'Play against Ollama AI' },
    { id: 'LOCAL_MULTIPLAYER' as GameMode, icon: Users,  label: 'Local 2P',    desc: 'Two players, same screen' },
    { id: 'ONLINE_MULTIPLAYER' as GameMode,icon: Globe,  label: 'Online',      desc: 'Challenge a friend online', requiresAuth: true },
  ]

  const difficulties: { id: AiDifficulty; label: string; desc: string; color: string }[] = [
    { id: 'EASY',   label: 'Easy',   desc: 'Random moves',          color: 'border-emerald-600/40 data-[selected=true]:bg-emerald-900/20 data-[selected=true]:border-emerald-500/60 data-[selected=true]:text-emerald-400' },
    { id: 'MEDIUM', label: 'Medium', desc: 'AI-powered strategy',   color: 'border-amber-600/40 data-[selected=true]:bg-amber-900/20 data-[selected=true]:border-amber-500/60 data-[selected=true]:text-amber-400' },
    { id: 'HARD',   label: 'Hard',   desc: 'Deep AI analysis',      color: 'border-red-600/40 data-[selected=true]:bg-red-900/20 data-[selected=true]:border-red-500/60 data-[selected=true]:text-red-400' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Game" size="md">
      <div className="space-y-6">

        {/* Game Mode */}
        <div>
          <p className="text-xs text-cream/40 uppercase tracking-widest mb-3">Game Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {modes.map(({ id, icon: Icon, label, desc, requiresAuth }) => {
              const locked = requiresAuth && !isAuthenticated()
              return (
                <button
                  key={id}
                  onClick={() => !locked && setMode(id)}
                  disabled={locked}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === id
                      ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
                      : 'bg-surface-800 border-cream/[0.08] text-cream/50 hover:border-cream/20 hover:text-cream/70'
                  }`}
                >
                  <Icon size={18} />
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{locked ? 'Sign in required' : desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Options */}
        {mode === 'AI' && (
          <>
            {/* Difficulty */}
            <div>
              <p className="text-xs text-cream/40 uppercase tracking-widest mb-3">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map(({ id, label, desc, color }) => (
                  <button
                    key={id}
                    data-selected={difficulty === id}
                    onClick={() => setDifficulty(id)}
                    className={`p-3 rounded-xl border text-left transition-all ${color} ${
                      difficulty === id ? '' : 'bg-surface-800 text-cream/50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Color */}
            <div>
              <p className="text-xs text-cream/40 uppercase tracking-widest mb-3">You play as</p>
              <div className="grid grid-cols-2 gap-2">
                {(['WHITE', 'BLACK'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setAiColor(c === 'WHITE' ? 'BLACK' : 'WHITE')}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      (c === 'WHITE' && aiColor === 'BLACK') || (c === 'BLACK' && aiColor === 'WHITE')
                        ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
                        : 'bg-surface-800 border-cream/[0.08] text-cream/50 hover:border-cream/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      c === 'WHITE' ? 'bg-cream border-cream/40' : 'bg-surface-900 border-cream/30'
                    }`} />
                    <span className="text-sm font-medium">{c === 'WHITE' ? 'White' : 'Black'}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Online opponent */}
        {mode === 'ONLINE_MULTIPLAYER' && (
          <div>
            <Input
              label="Opponent Username (optional)"
              placeholder="Leave blank to open a public lobby"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
          </div>
        )}

        {/* Theme */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-cream/40 uppercase tracking-widest">Board Theme</p>
          <ThemeSelector selected={theme} onChange={setTheme} />
        </div>

        {/* Submit */}
        <Button
          variant="gold"
          size="lg"
          loading={loading}
          onClick={handleCreate}
          className="w-full"
        >
          <Swords size={16} />
          Start Game
          <ChevronRight size={16} />
        </Button>
      </div>
    </Modal>
  )
}
