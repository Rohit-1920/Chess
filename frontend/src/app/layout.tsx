import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { InviteToastListener } from '@/components/friends/InviteToast'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChessMind — AI-Powered Chess',
  description: 'Play chess against a local AI, challenge friends online, or enjoy offline matches.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <InviteToastListener />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid rgba(232,180,35,0.2)',
              color: '#f0e6c4',
            },
          }}
        />
      </body>
    </html>
  )
}
