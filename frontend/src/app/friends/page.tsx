'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Clock, Search } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { FriendCard } from '@/components/friends/FriendCard'
import { FriendSearch } from '@/components/friends/FriendSearch'
import { useFriendsStore } from '@/store/friendsStore'
import { useAuthStore } from '@/store/authStore'

type Tab = 'friends' | 'requests' | 'search'

export default function FriendsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { friends, pendingReceived, pendingSent, loadFriends, isLoading } = useFriendsStore()
  const [tab, setTab] = useState<Tab>('friends')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    loadFriends()
  }, [])

  const onlineFriends  = friends.filter(f => f.isOnline)
  const offlineFriends = friends.filter(f => !f.isOnline)
  const totalPending   = pendingReceived.length + pendingSent.length

  const tabs = [
    { id: 'friends' as Tab,  label: 'Friends',  icon: Users,    count: friends.length },
    { id: 'requests' as Tab, label: 'Requests', icon: Clock,    count: totalPending, badge: pendingReceived.length },
    { id: 'search' as Tab,   label: 'Add',      icon: UserPlus, count: 0 },
  ]

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-4xl text-cream mb-1">Friends</h1>
          <p className="text-cream/40 text-sm">
            {onlineFriends.length} online · {friends.length} total
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-surface-800 border border-cream/[0.08] mb-6 animate-fade-up delay-100">
          {tabs.map(({ id, label, icon: Icon, count, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                tab === id
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-cream/40 hover:text-cream/60'
              }`}
            >
              <Icon size={15} />
              {label}
              {badge && badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-surface-950 text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : count > 0 && tab === id ? (
                <span className="text-xs opacity-60">({count})</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-up delay-200">

          {/* Friends tab */}
          {tab === 'friends' && (
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface-800 animate-pulse" />
                ))
              ) : friends.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-cream/[0.08] rounded-2xl">
                  <Users size={36} className="text-cream/10 mx-auto mb-3" />
                  <p className="text-cream/30">No friends yet</p>
                  <p className="text-cream/20 text-sm mt-1">Search for players to add them</p>
                  <button
                    onClick={() => setTab('search')}
                    className="mt-4 px-4 py-2 rounded-lg bg-gold-500/15 text-gold-400 border border-gold-500/25 text-sm hover:bg-gold-500/25 transition-all"
                  >
                    Find Friends
                  </button>
                </div>
              ) : (
                <>
                  {onlineFriends.length > 0 && (
                    <div>
                      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2 px-1">
                        Online — {onlineFriends.length}
                      </p>
                      <div className="space-y-2">
                        {onlineFriends.map(f => (
                          <FriendCard key={f.friendshipId} friend={f} type="friend" />
                        ))}
                      </div>
                    </div>
                  )}
                  {offlineFriends.length > 0 && (
                    <div>
                      <p className="text-xs text-cream/20 uppercase tracking-widest mb-2 px-1 mt-4">
                        Offline — {offlineFriends.length}
                      </p>
                      <div className="space-y-2">
                        {offlineFriends.map(f => (
                          <FriendCard key={f.friendshipId} friend={f} type="friend" />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Requests tab */}
          {tab === 'requests' && (
            <div className="space-y-6">
              {pendingReceived.length > 0 && (
                <div>
                  <p className="text-xs text-sky-400 uppercase tracking-widest mb-3 px-1">
                    Incoming Requests — {pendingReceived.length}
                  </p>
                  <div className="space-y-2">
                    {pendingReceived.map(f => (
                      <FriendCard key={f.friendshipId} friend={f} type="pending_received" />
                    ))}
                  </div>
                </div>
              )}
              {pendingSent.length > 0 && (
                <div>
                  <p className="text-xs text-cream/30 uppercase tracking-widest mb-3 px-1">
                    Sent Requests — {pendingSent.length}
                  </p>
                  <div className="space-y-2">
                    {pendingSent.map(f => (
                      <FriendCard key={f.friendshipId} friend={f} type="pending_sent" />
                    ))}
                  </div>
                </div>
              )}
              {totalPending === 0 && (
                <div className="py-16 text-center border border-dashed border-cream/[0.08] rounded-2xl">
                  <Clock size={32} className="text-cream/10 mx-auto mb-3" />
                  <p className="text-cream/30 text-sm">No pending requests</p>
                </div>
              )}
            </div>
          )}

          {/* Search tab */}
          {tab === 'search' && (
            <div className="p-5 rounded-2xl bg-surface-900 border border-cream/[0.07]">
              <h2 className="font-display text-lg text-cream mb-4">Find Players</h2>
              <FriendSearch />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
