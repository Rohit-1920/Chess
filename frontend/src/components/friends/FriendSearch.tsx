'use client'
import { useState, useCallback } from 'react'
import { Search, UserPlus, Check, Clock, User } from 'lucide-react'
import { friendsApi } from '@/lib/friendsApi'
import { useFriendsStore } from '@/store/friendsStore'
import { toast } from 'sonner'

interface SearchResult {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  rating: number
  isOnline: boolean
  friendshipStatus: string
}

export function FriendSearch() {
  const { sendFriendRequest } = useFriendsStore()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding]   = useState<number | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await friendsApi.search(q.trim())
      setResults(data.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    const t = setTimeout(() => search(q), 400)
    return () => clearTimeout(t)
  }

  const addFriend = async (result: SearchResult) => {
    setAdding(result.id)
    try {
      await sendFriendRequest(result.username)
      toast.success(`Friend request sent to ${result.username}!`)
      setResults(prev => prev.map(r =>
        r.id === result.id ? { ...r, friendshipStatus: 'PENDING_SENT' } : r
      ))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send request')
    } finally { setAdding(null) }
  }

  const statusLabel: Record<string, React.ReactNode> = {
    ACCEPTED:         <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={11} /> Friends</span>,
    PENDING_SENT:     <span className="text-xs text-cream/30 flex items-center gap-1"><Clock size={11} /> Pending</span>,
    PENDING_RECEIVED: <span className="text-xs text-sky-400">Wants to add you</span>,
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30 pointer-events-none" />
        <input
          value={query}
          onChange={handleInput}
          placeholder="Search by username or display name…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-700 border border-cream/[0.08] text-sm text-cream placeholder-cream/20 outline-none focus:border-gold-500/30 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-700 border border-cream/[0.06]">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-surface-600 flex items-center justify-center overflow-hidden">
                  {r.avatarUrl
                    ? <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <User size={15} className="text-cream/30" />
                  }
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-700 ${r.isOnline ? 'bg-emerald-400' : 'bg-surface-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream truncate">{r.displayName || r.username}</p>
                <p className="text-xs text-cream/30">@{r.username} · {r.rating} ELO</p>
              </div>
              <div className="flex-shrink-0">
                {r.friendshipStatus && r.friendshipStatus !== 'NONE'
                  ? statusLabel[r.friendshipStatus] || null
                  : (
                    <button
                      onClick={() => addFriend(r)}
                      disabled={adding === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 border border-gold-500/25 hover:bg-gold-500/25 text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {adding === r.id
                        ? <div className="w-3 h-3 border border-gold-400 border-t-transparent rounded-full animate-spin" />
                        : <UserPlus size={12} />
                      }
                      Add
                    </button>
                  )
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-center text-sm text-cream/30 py-4">No users found for "{query}"</p>
      )}
    </div>
  )
}
