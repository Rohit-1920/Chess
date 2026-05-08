/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#080808',
          900: '#111111',
          800: '#1a1a1a',
          700: '#242424',
          600: '#2e2e2e',
          500: '#3a3a3a',
        },
        gold: {
          300: '#fcd97c',
          400: '#f5c842',
          500: '#e8b423',
          600: '#c99a10',
          700: '#a37d0a',
        },
        cream: {
          50:  '#fdfbf5',
          100: '#faf5e4',
          200: '#f0e6c4',
          300: '#e2cc96',
        },
        chess: {
          light: '#f0d9b5',
          dark:  '#b58863',
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':     'fadeUp 0.5s ease forwards',
        'fade-in':     'fadeIn 0.4s ease forwards',
        'slide-right': 'slideRight 0.3s ease forwards',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 180, 35, 0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(232, 180, 35, 0.15)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'gold':    '0 0 30px rgba(232, 180, 35, 0.2)',
        'gold-sm': '0 0 12px rgba(232, 180, 35, 0.15)',
        'board':   '0 25px 80px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.5)',
        'card':    '0 4px 24px rgba(0,0,0,0.4)',
        'panel':   '0 2px 12px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
