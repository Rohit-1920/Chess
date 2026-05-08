'use client'
import Link from 'next/link'
import { Crown, Zap, Users, Brain, ChevronRight, Shield, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 overflow-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 glass border-b border-cream/[0.05]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Crown size={16} className="text-gold-400" />
            </div>
            <span className="font-display text-xl text-cream">Chess<span className="gold-text">Mind</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
            <Link href="/register" className="btn-gold text-sm px-4 py-2">Play Free</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/20 bg-gold-500/5 mb-8 animate-fade-in">
            <Zap size={13} className="text-gold-400" />
            <span className="text-xs font-medium text-gold-400 tracking-widest uppercase">Powered by Local AI</span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl text-cream leading-[1.05] mb-6 animate-fade-up">
            Chess, Elevated<br />
            <span className="gold-text italic">by Intelligence</span>
          </h1>

          <p className="text-lg text-cream/50 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up delay-100">
            Play against a local AI, challenge friends online, or enjoy offline matches —
            all in one beautifully crafted platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-200">
            <Link href="/register" className="btn-gold text-base px-8 py-4 shadow-gold">
              Start Playing Free
              <ChevronRight size={18} />
            </Link>
            <Link href="/login" className="btn-ghost text-base px-8 py-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Chess Board Preview ─── */}
      <section className="px-6 pb-16">
        <div className="max-w-lg mx-auto animate-fade-up delay-300">
          <div className="relative p-1 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(232,180,35,0.3) 0%, transparent 50%, rgba(232,180,35,0.1) 100%)' }}>
            <div className="rounded-xl overflow-hidden shadow-board bg-surface-900 p-4">
              {/* Mini chess board visual */}
              <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden border border-cream/10">
                {Array.from({ length: 64 }, (_, i) => {
                  const row = Math.floor(i / 8)
                  const col = i % 8
                  const isLight = (row + col) % 2 === 0
                  const pieces: Record<string, string> = {
                    '0-0':'♜','0-1':'♞','0-2':'♝','0-3':'♛','0-4':'♚','0-5':'♝','0-6':'♞','0-7':'♜',
                    '1-0':'♟','1-1':'♟','1-2':'♟','1-3':'♟','1-4':'♟','1-5':'♟','1-6':'♟','1-7':'♟',
                    '6-0':'♙','6-1':'♙','6-2':'♙','6-3':'♙','6-4':'♙','6-5':'♙','6-6':'♙','6-7':'♙',
                    '7-0':'♖','7-1':'♘','7-2':'♗','7-3':'♕','7-4':'♔','7-5':'♗','7-6':'♘','7-7':'♖',
                  }
                  const piece = pieces[`${row}-${col}`]
                  return (
                    <div
                      key={i}
                      className="aspect-square flex items-center justify-center text-lg select-none"
                      style={{ background: isLight ? '#f0d9b5' : '#b58863' }}
                    >
                      {piece && <span style={{ color: row < 2 ? '#1a1a1a' : '#f0f0f0', textShadow: row < 2 ? 'none' : '0 1px 2px rgba(0,0,0,0.5)', fontSize: '1.1rem' }}>{piece}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-6 py-20 border-t border-cream/[0.05]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl text-cream text-center mb-4">Everything you need to play</h2>
          <p className="text-cream/40 text-center mb-14 max-w-md mx-auto">One platform. Three game modes. Infinite possibilities.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI Opponent',
                desc: 'Powered by a local Ollama LLM. Choose Easy, Medium, or Hard and watch the machine think.',
                color: 'from-amber-500/20 to-amber-900/5',
                accent: 'text-gold-400',
              },
              {
                icon: Users,
                title: 'Local Multiplayer',
                desc: 'Two players, one screen. Pass-and-play chess for friends or family. No login required.',
                color: 'from-sky-500/20 to-sky-900/5',
                accent: 'text-sky-400',
              },
              {
                icon: Globe,
                title: 'Online Multiplayer',
                desc: 'Challenge friends or strangers in real-time over WebSocket. Live move updates.',
                color: 'from-emerald-500/20 to-emerald-900/5',
                accent: 'text-emerald-400',
              },
            ].map(({ icon: Icon, title, desc, color, accent }, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl bg-gradient-to-b ${color} border border-cream/[0.07] hover:border-cream/[0.14] transition-all duration-300 group`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center mb-4 ${accent}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-xl text-cream mb-2">{title}</h3>
                <p className="text-sm text-cream/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Themes Row ─── */}
      <section className="px-6 py-16 border-t border-cream/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl text-cream mb-3">7 Board Themes</h2>
          <p className="text-cream/40 mb-10">Pick the aesthetic that matches your style</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Classic',  light: '#f0d9b5', dark: '#b58863' },
              { name: 'Dark',     light: '#4a4a4a', dark: '#1a1a1a' },
              { name: 'Neon',     light: '#1a1a2e', dark: '#0a0a1a' },
              { name: 'Wood',     light: '#deb887', dark: '#8b4513' },
              { name: 'Marble',   light: '#e8e8e8', dark: '#606060' },
              { name: 'Ocean',    light: '#a8d8ea', dark: '#1a5276' },
              { name: 'Forest',   light: '#c8e6c9', dark: '#2e7d32' },
            ].map(({ name, light, dark }) => (
              <div key={name} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden w-16 h-16 border border-cream/10 group-hover:border-gold-500/30 transition-colors shadow-md">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} style={{ background: (Math.floor(i/4) + i) % 2 === 0 ? light : dark }} />
                  ))}
                </div>
                <span className="text-xs text-cream/40 group-hover:text-cream/70 transition-colors">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-20 border-t border-cream/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <Shield size={32} className="text-gold-500/50 mx-auto mb-4" />
          <h2 className="font-display text-4xl text-cream mb-4">Ready to play?</h2>
          <p className="text-cream/40 mb-8">Create a free account in seconds. No credit card needed.</p>
          <Link href="/register" className="btn-gold text-base px-10 py-4 shadow-gold inline-flex">
            Create Free Account
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-cream/[0.05] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-gold-500/50" />
            <span className="text-sm text-cream/30 font-display">ChessMind</span>
          </div>
          <p className="text-xs text-cream/20">Built with Next.js · Spring Boot · Ollama · MySQL · Redis</p>
        </div>
      </footer>
    </div>
  )
}
