import { ThemeConfig } from '@/types'

export const CHESS_THEMES: ThemeConfig[] = [
  {
    id: 'CLASSIC',
    label: 'Classic',
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    preview: 'from-amber-200 to-amber-700',
  },
  {
    id: 'DARK',
    label: 'Dark Mode',
    lightSquare: '#4a4a4a',
    darkSquare: '#1a1a1a',
    preview: 'from-zinc-500 to-zinc-900',
  },
  {
    id: 'NEON',
    label: 'Neon',
    lightSquare: '#1a1a2e',
    darkSquare: '#0a0a1a',
    boardStyle: { border: '2px solid #00ff88' },
    preview: 'from-emerald-400 to-slate-900',
  },
  {
    id: 'WOOD',
    label: 'Wood',
    lightSquare: '#deb887',
    darkSquare: '#8b4513',
    preview: 'from-yellow-200 to-yellow-800',
  },
  {
    id: 'MARBLE',
    label: 'Marble',
    lightSquare: '#e8e8e8',
    darkSquare: '#606060',
    preview: 'from-gray-200 to-gray-600',
  },
  {
    id: 'OCEAN',
    label: 'Ocean',
    lightSquare: '#a8d8ea',
    darkSquare: '#1a5276',
    preview: 'from-sky-300 to-blue-800',
  },
  {
    id: 'FOREST',
    label: 'Forest',
    lightSquare: '#c8e6c9',
    darkSquare: '#2e7d32',
    preview: 'from-green-200 to-green-800',
  },
]

export const getTheme = (id: string): ThemeConfig =>
  CHESS_THEMES.find((t) => t.id === id) ?? CHESS_THEMES[0]

// ─── Custom piece styles per theme ───────────────────────────────────────────

export const getNeonPieceStyle = () => ({
  filter: 'drop-shadow(0 0 4px #00ff88)',
})
