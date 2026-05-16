'use client'
import { useState } from 'react'
import { User, Swords, UserMinus, Check, X, Clock } from 'lucide-react'
import { Friend, useFriendsStore } from '@/store/friendsStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { invitesApi } from '@/lib/friendsApi'

interface FriendCardProps {
  friend: Friend
  type: 'friend' | 'pending_received' | 'pending_sent'
}

export function FriendCard({ friend, type }: FriendCardProps) {
  const router = useRouter()
  const { acceptFriend, declineFriend, removeFriend } = useFriendsStore()
  const [loading, setLoading] = useState(false)

  const handle = async (action: () => Promise<void>, msg: string) => {
    setLoading(true)
    try { await action(); toast.success(msg) }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const sendInvite = async () => {
    setLoading(true)
    try {
      const { data } = await invitesApi.send({ receiverUsername: friend.username })
      toast.success(`Game invite sent to ${friend.username}!`)
      if (data.data?.gameId) router.push(`/game/${data.data.gameId}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send invite')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800 border border-cream/[0.07] hover:border-cream/[0.12] transition-all">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-700 border border-cream/10 flex items-center justify-center overflow-hidden">
          {friend.avatarUrl
            ? <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <User size={18} className="text-cream/30" />
          }
        </div>
        {type === 'friend' && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-800 ${
            friend.isOnline ? 'bg-emerald-400' : 'bg-surface-600'
          }`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream truncate">{friend.displayName || friend.username}</p>
        <div className="flex items-center gap-2 text-xs text-cream/30">
          <span>@{friend.username}</span>
          <span>·</span>
          <span>{friend.rating} ELO</span>
          {type === 'friend' && (
            <>
              <span>·</span>
              <span className={friend.isOnline ? 'text-emerald-400' : 'text-cream/20'}>
                {friend.isOnline ? 'Online' : 'Offline'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {type === 'friend' && (
          <>
            <button
              onClick={sendInvite}
              disabled={loading}
              title="Invite to game"
              className="p-2 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 border border-gold-500/20 transition-all disabled:opacity-50"
            >
              <Swords size={14} />
            </button>
            <button
              onClick={() => handle(() => removeFriend(friend.friendshipId), 'Friend removed')}
              disabled={loading}
              title="Remove friend"
              className="p-2 rounded-lg text-cream/20 hover:text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-50"
            >
              <UserMinus size={14} />
            </button>
          </>
        )}

        {type === 'pending_received' && (
          <>
            <button
              onClick={() => handle(() => acceptFriend(friend.friendshipId), `Now friends with ${friend.username}!`)}
              disabled={loading}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all disabled:opacity-50"
              title="Accept"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => handle(() => declineFriend(friend.friendshipId), 'Request declined')}
              disabled={loading}
              className="p-2 rounded-lg text-cream/20 hover:text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-50"
              title="Decline"
            >
              <X size={14} />
            </button>
          </>
        )}

        {type === 'pending_sent' && (
          <div className="flex items-center gap-1 text-xs text-cream/30">
            <Clock size={12} />
            <span>Pending</span>
          </div>
        )}
      </div>
    </div>
  )
}
