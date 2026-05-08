'use client'
import { useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { GameTheme } from '@/types'
import { CHESS_THEMES } from '@/lib/chess-themes'

interface ThemeSelectorProps {
  selected: GameTheme
  onChange: (theme: GameTheme) => void
}

export function ThemeSelector({ selected, onChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-cream/[0.08] text-cream/50 hover:text-cream/70 hover:border-cream/[0.15] transition-all text-xs"
      >
        <Palette size={13} />
        Theme
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl bg-surface-800 border border-cream/[0.1] shadow-board overflow-hidden animate-fade-in">
            <div className="p-2 space-y-0.5">
              {CHESS_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => { onChange(theme.id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    selected === theme.id
                      ? 'bg-gold-500/15 text-gold-400'
                      : 'text-cream/60 hover:bg-surface-700 hover:text-cream'
                  }`}
                >
                  {/* Mini board preview */}
                  <div className="grid grid-cols-4 gap-0 w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-cream/10">
                    {Array.from({ length: 16 }, (_, i) => (
                      <div key={i} style={{
                        background: (Math.floor(i/4) + i) % 2 === 0 ? theme.lightSquare : theme.darkSquare
                      }} />
                    ))}
                  </div>

                  <span className="flex-1">{theme.label}</span>

                  {selected === theme.id && (
                    <Check size={13} className="text-gold-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
