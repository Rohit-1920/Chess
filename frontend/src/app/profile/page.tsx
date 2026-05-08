'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Edit3, Save, BarChart2, Trophy, TrendingUp, Minus } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ThemeSelector } from '@/components/chess/ThemeSelector'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api'
import { GameTheme } from '@/types'
import { CHESS_THEMES } from '@/lib/chess-themes'
import { toast } from 'sonner'

const schema = z.object({
  username:    z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/).optional().or(z.literal('')),
  displayName: z.string().max(100).optional(),
  avatarUrl:   z.string().url().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, refreshProfile, isAuthenticated } = useAuthStore()
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [theme, setTheme]           = useState<GameTheme>(user?.preferredTheme || 'CLASSIC')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username:    user?.username || '',
      displayName: user?.displayName || '',
      avatarUrl:   user?.avatarUrl || '',
    },
  })

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    refreshProfile()
  }, [])

  useEffect(() => {
    if (user) {
      setTheme(user.preferredTheme)
      reset({ username: user.username, displayName: user.displayName || '', avatarUrl: user.avatarUrl || '' })
    }
  }, [user])

  const onSave = async (data: FormData) => {
    setSaving(true)
    try {
      await userApi.updateProfile({
        username:       data.username || undefined,
        displayName:    data.displayName || undefined,
        avatarUrl:      data.avatarUrl || undefined,
        preferredTheme: theme,
      })
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  const winRate = user.gamesPlayed > 0
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
    : 0

  const stats = [
    { label: 'Rating',     value: user.rating,     icon: TrendingUp, color: 'text-gold-400',    bg: 'bg-gold-500/10' },
    { label: 'Wins',       value: user.gamesWon,   icon: Trophy,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Losses',     value: user.gamesLost,  icon: Minus,      color: 'text-red-400',     bg: 'bg-red-500/10' },
    { label: 'Played',     value: user.gamesPlayed,icon: BarChart2,  color: 'text-sky-400',     bg: 'bg-sky-500/10' },
  ]

  const themeConfig = CHESS_THEMES.find(t => t.id === user.preferredTheme) || CHESS_THEMES[0]

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 animate-fade-up">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <User size={36} className="text-gold-400/60" />
              }
            </div>
            {/* Mini board preview in corner */}
            <div className="absolute -bottom-2 -right-2 grid grid-cols-4 gap-0 w-8 h-8 rounded overflow-hidden border border-surface-900 shadow-md">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} style={{ background: (Math.floor(i/4)+i)%2===0 ? themeConfig.lightSquare : themeConfig.darkSquare }} />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="font-display text-4xl text-cream">{user.displayName || user.username}</h1>
            <p className="text-cream/40 mt-1">@{user.username}</p>
            <div className="flex items-center gap-3 mt-3 text-sm text-cream/30">
              {user.email && <span>{user.email}</span>}
              {user.phone && <span>{user.phone}</span>}
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Button
            variant={editing ? 'ghost' : 'surface'}
            size="sm"
            onClick={() => editing ? setEditing(false) : setEditing(true)}
          >
            <Edit3 size={14} />
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 animate-fade-up delay-100">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="p-5 rounded-2xl bg-surface-900 border border-cream/[0.07]">
              <div className={`inline-flex p-2 rounded-lg ${bg} ${color} mb-3`}>
                <Icon size={15} />
              </div>
              <p className="text-2xl font-display text-cream">{value}</p>
              <p className="text-xs text-cream/40 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Win Rate Bar */}
        <div className="p-5 rounded-2xl bg-surface-900 border border-cream/[0.07] mb-8 animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-cream/50">Win Rate</span>
            <span className="text-sm font-medium text-cream">{winRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${winRate}%`,
                background: 'linear-gradient(90deg, #c99a10, #fcd97c)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-cream/20">
            <span>{user.gamesWon}W / {user.gamesLost}L / {user.gamesDrawn}D</span>
            <span>{user.gamesPlayed} games total</span>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSubmit(onSave)} className="p-6 rounded-2xl bg-surface-900 border border-gold-500/20 space-y-5 animate-fade-up">
            <h2 className="font-display text-xl text-cream">Edit Profile</h2>

            <Input
              {...register('username')}
              label="Username"
              placeholder={user.username}
              error={errors.username?.message}
            />
            <Input
              {...register('displayName')}
              label="Display Name"
              placeholder={user.displayName || user.username}
            />
            <Input
              {...register('avatarUrl')}
              label="Avatar URL (optional)"
              placeholder="https://example.com/avatar.jpg"
              error={errors.avatarUrl?.message}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm text-cream/50">Preferred Board Theme</label>
              <ThemeSelector selected={theme} onChange={setTheme} />
            </div>

            <Button type="submit" variant="gold" loading={saving} className="w-full">
              <Save size={15} />
              Save Changes
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}
