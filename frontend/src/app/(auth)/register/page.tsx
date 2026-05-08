'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Crown, Mail, Phone, User, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  identifierType: z.enum(['email', 'phone']),
  email:    z.string().optional(),
  phone:    z.string().optional(),
  username: z.string().min(3, 'Min 3 characters').max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Only letters, digits, _, ., -'),
  displayName: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((d) => {
  if (d.identifierType === 'email') return !!d.email && d.email.includes('@')
  return !!d.phone && d.phone.length >= 7
}, { message: 'Valid email or phone required', path: ['email'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [idType, setIdType] = useState<'email' | 'phone'>('email')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { identifierType: 'email' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({
        email:       data.identifierType === 'email' ? data.email : undefined,
        phone:       data.identifierType === 'phone' ? data.phone : undefined,
        username:    data.username,
        password:    data.password,
        displayName: data.displayName || data.username,
      })
      toast.success('Account created! Welcome to ChessMind.')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed'
      toast.error(msg)
    }
  }

  const switchType = (t: 'email' | 'phone') => {
    setIdType(t)
    setValue('identifierType', t)
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── Left decorative panel ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-surface-900 border-r border-cream/[0.06] p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="grid grid-cols-8 h-full">
            {Array.from({ length: 64 }, (_, i) => (
              <div key={i} className={(Math.floor(i/8)+i)%2===0 ? 'bg-cream' : ''} />
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
          <h2 className="font-display text-4xl text-cream mb-4 leading-tight">Join the<br />arena.</h2>
          <p className="text-cream/40 leading-relaxed max-w-xs">
            Free account. Instant access. Play against AI or challenge real players.
          </p>
        </div>
        <div className="relative space-y-3">
          {['Play vs AI (Easy/Medium/Hard)', 'Real-time online multiplayer', '7 board themes', 'Track your ELO rating'].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-cream/60">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Crown size={20} className="text-gold-400" />
            <span className="font-display text-xl text-cream">Chess<span className="gold-text">Mind</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl text-cream mb-2">Create account</h1>
            <p className="text-cream/40 text-sm">Sign up with email or phone number</p>
          </div>

          {/* Email / Phone toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-surface-800 border border-cream/[0.08] mb-6">
            {(['email', 'phone'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  idType === t
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-cream/40 hover:text-cream/60'
                }`}
              >
                {t === 'email' ? <Mail size={14} /> : <Phone size={14} />}
                {t === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register('identifierType')} />

            {idType === 'email' ? (
              <Input
                {...register('email')}
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                error={errors.email?.message}
              />
            ) : (
              <Input
                {...register('phone')}
                label="Phone Number"
                type="tel"
                placeholder="+1 555 000 0000"
                icon={<Phone size={16} />}
                error={errors.phone?.message}
              />
            )}

            <Input
              {...register('username')}
              label="Username"
              placeholder="chesswizard99"
              icon={<User size={16} />}
              error={errors.username?.message}
            />

            <Input
              {...register('displayName')}
              label="Display Name (optional)"
              placeholder="Chess Wizard"
              icon={<User size={16} />}
            />

            <div className="relative">
              <Input
                {...register('password')}
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min 8 characters"
                icon={<Lock size={16} />}
                error={errors.password?.message}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 bottom-3 text-cream/30 hover:text-cream/60 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              {...register('confirmPassword')}
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat password"
              icon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" variant="gold" size="lg" loading={isLoading} className="mt-2 w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-cream/30 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
