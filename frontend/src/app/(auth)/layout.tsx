import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChessMind — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth pages use their own full-screen layout (no Navbar/Footer)
  return (
    <div className="min-h-screen bg-surface-950">
      {children}
    </div>
  )
}
