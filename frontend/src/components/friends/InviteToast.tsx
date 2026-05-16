'use client'
import { useEffect } from 'react'
import { Swords } from 'lucide-react'
import { useFriendsStore, GameInvite } from '@/store/friendsStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function InviteToastListener() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { pendingInvites, loadPendingInvites, respondToInvite } = useFriendsStore()

  // Poll for pending invites every 15 seconds
  useEffect(() => {
    if (!isAuthenticated()) return
    loadPendingInvites()
    const interval = setInterval(loadPendingInvites, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated()])

  // Show toast for each pending invite
  useEffect(() => {
    pendingInvites.forEach((invite: GameInvite) => {
      const toastId = `invite-${invite.id}`
      toast.custom(() => (
        <InviteToastContent
          invite={invite}
          onAccept={async () => {
            toast.dismiss(toastId)
            const result = await respondToInvite(invite.id, true)
            if (result?.gameId) router.push(`/game/${result.gameId}`)
          }}
          onDecline={() => {
            toast.dismiss(toastId)
            respondToInvite(invite.id, false)
          }}
        />
      ), { id: toastId, duration: 30000 })
    })
  }, [pendingInvites.length])

  return null
}

function InviteToastContent({
  invite, onAccept, onDecline
}: {
  invite: GameInvite
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="w-80 rounded-xl p-4 border border-gold-500/30 shadow-board"
         style={{ background: '#1a1a1a' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
          <Swords size={16} className="text-gold-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-cream">Game Invite!</p>
          <p className="text-xs text-cream/50 mt-0.5">
            <span className="text-cream/80">{invite.sender.displayName || invite.sender.username}</span>
            {' '}wants to play chess
          </p>
          {invite.message && (
            <p className="text-xs text-cream/40 mt-1 italic">"{invite.message}"</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onDecline}
          className="flex-1 py-1.5 rounded-lg text-xs text-cream/40 border border-cream/10 hover:border-cream/20 hover:text-cream/60 transition-all"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium text-surface-950 transition-all"
          style={{ background: 'linear-gradient(135deg, #fcd97c, #e8b423)' }}
        >
          Accept & Play
        </button>
      </div>
    </div>
  )
}
