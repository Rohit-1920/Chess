'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Crown, LayoutDashboard, Users, User, LogOut, Swords } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lobby', label: 'Lobby', icon: Users },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16">
      {/* Glass bar */}
      <div className="h-full glass border-b border-cream/[0.06]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href={isAuthenticated() ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
              <Crown size={16} className="text-gold-400" />
            </div>
            <span className="font-display text-xl text-cream tracking-tight">
              Chess<span className="gold-text">Mind</span>
            </span>
          </Link>

          {/* Center nav links (authenticated) */}
          {isAuthenticated() && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith(href)
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                      : 'text-cream/60 hover:text-cream hover:bg-surface-700'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                {/* Play button */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 btn-gold text-sm px-4 py-2"
                >
                  <Swords size={15} />
                  Play
                </Link>

                {/* User menu */}
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-700 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                      {user?.avatarUrl
                        ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        : <User size={14} className="text-gold-400" />
                      }
                    </div>
                    <span className="text-sm text-cream/70 group-hover:text-cream transition-colors hidden sm:block">
                      {user?.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-cream/40 hover:text-red-400 hover:bg-red-900/20 transition-all"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
                <Link href="/register" className="btn-gold text-sm px-4 py-2">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
