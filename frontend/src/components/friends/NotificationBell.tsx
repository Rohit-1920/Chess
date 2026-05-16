'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, X, UserPlus, Swords, Trophy } from 'lucide-react'
import { useFriendsStore, Notification } from '@/store/friendsStore'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { notifications, unreadCount, loadNotifications, loadUnreadCount, markRead, markAllRead } = useFriendsStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated()) return
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated()])

  useEffect(() => {
    if (open) loadNotifications()
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isAuthenticated()) return null

  const typeIcon: Record<string, React.ReactNode> = {
    FRIEND_REQUEST:       <UserPlus size={14} className="text-sky-400" />,
    FRIEND_ACCEPTED:      <UserPlus size={14} className="text-emerald-400" />,
    GAME_INVITE:          <Swords size={14} className="text-gold-400" />,
    GAME_INVITE_ACCEPTED: <Trophy size={14} className="text-gold-400" />,
    GAME_INVITE_DECLINED: <X size={14} className="text-red-400" />,
  }

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead(n.id)
    try {
      const data = n.data ? JSON.parse(n.data) : {}
      if (data.gameId) router.push(`/game/${data.gameId}`)
    } catch {}
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-cream/40 hover:text-cream hover:bg-surface-700 transition-all"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold-500 text-surface-950 text-[10px] font-bold flex items-center justify-center animate-pulse-ring">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface-800 border border-cream/[0.1] shadow-board z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream/[0.07]">
            <span className="text-sm font-medium text-cream">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-cream/30">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-cream/[0.05] cursor-pointer transition-colors hover:bg-surface-700 ${
                    !n.isRead ? 'bg-gold-500/5' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center">
                    {typeIcon[n.type] || <Bell size={12} className="text-cream/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-cream truncate">{n.title}</p>
                    <p className="text-xs text-cream/50 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-cream/25 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
