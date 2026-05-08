'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Crown, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  identifier: z.string().min(1, 'Email, phone, or username required'),
  password:   z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.identifier, data.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── Left panel (brand) ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-surface-900 border-r border-cream/[0.06] p-12 relative overflow-hidden">
        {/* Decorative board grid */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="grid grid-cols-8 h-full">
            {Array.from({ length: 64 }, (_, i) => (
              <div key={i} className={(Math.floor(i/8)+i)%2===0 ? 'bg-cream' : 'bg-transparent'} />
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Crown size={18} className="text-gold-400" />
            </div>
            <span className="font-display text-2xl text-cream">Chess<span className="gold-text">Mind</span></span>
          </div>

          <h2 className="font-display text-4xl text-cream mb-4 leading-tight">
            Welcome<br />back.
          </h2>
          <p className="text-cream/40 leading-relaxed max-w-xs">
            Your games, your rating, and your opponents are waiting.
          </p>
        </div>

        {/* Stats preview */}
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Games Played', value: '∞' },
            { label: 'AI Difficulty', value: '3 levels' },
            { label: 'Board Themes', value: '7' },
            { label: 'Real-time', value: 'WebSocket' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-surface-800 border border-cream/[0.06]">
              <p className="text-2xl font-display gold-text mb-1">{value}</p>
              <p className="text-xs text-cream/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right panel (form) ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Crown size={20} className="text-gold-400" />
            <span className="font-display text-xl text-cream">Chess<span className="gold-text">Mind</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl text-cream mb-2">Sign in</h1>
            <p className="text-cream/40 text-sm">Use your email, phone number, or username</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              {...register('identifier')}
              label="Email / Phone / Username"
              placeholder="you@example.com"
              autoComplete="username"
              icon={<Mail size={16} />}
              error={errors.identifier?.message}
            />

            <div className="relative">
              <Input
                {...register('password')}
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={<Lock size={16} />}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 bottom-3 text-cream/30 hover:text-cream/60 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" variant="gold" size="lg" loading={isLoading} className="mt-2 w-full">
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-cream/[0.08]" />
            <span className="text-xs text-cream/20">or</span>
            <div className="flex-1 h-px bg-cream/[0.08]" />
          </div>

          {/* Guest local play */}
          <Link href="/dashboard?mode=local" className="w-full btn-ghost flex items-center justify-center gap-2 text-sm">
            Play as Guest (local only)
          </Link>

          <p className="text-center text-sm text-cream/30 mt-8">
            Don't have an account?{' '}
            <Link href="/register" className="text-gold-400 hover:text-gold-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
