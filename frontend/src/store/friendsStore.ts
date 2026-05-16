import { create } from 'zustand'
import { friendsApi, invitesApi, notificationsApi } from '@/lib/friendsApi'

export interface Friend {
  friendshipId: number
  userId: number
  username: string
  displayName: string
  avatarUrl?: string
  rating: number
  status: string
  isOnline: boolean
  iRequested: boolean
  createdAt: string
}

export interface GameInvite {
  id: number
  status: string
  message?: string
  theme?: string
  expired: boolean
  sender: { id: number; username: string; displayName: string; avatarUrl?: string; rating: number }
  receiver: { id: number; username: string; displayName: string; avatarUrl?: string; rating: number }
  gameId?: number
  expiresAt: string
  createdAt: string
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  data?: string
  isRead: boolean
  createdAt: string
}

interface FriendsState {
  friends:          Friend[]
  pendingReceived:  Friend[]
  pendingSent:      Friend[]
  notifications:    Notification[]
  pendingInvites:   GameInvite[]
  unreadCount:      number
  isLoading:        boolean

  loadFriends:      () => Promise<void>
  loadNotifications:() => Promise<void>
  loadPendingInvites:() => Promise<void>
  loadUnreadCount:  () => Promise<void>
  sendFriendRequest:(username: string) => Promise<void>
  acceptFriend:     (id: number) => Promise<void>
  declineFriend:    (id: number) => Promise<void>
  removeFriend:     (id: number) => Promise<void>
  sendInvite:       (username: string, message?: string, theme?: string) => Promise<GameInvite>
  respondToInvite:  (id: number, accepted: boolean) => Promise<GameInvite | null>
  markAllRead:      () => Promise<void>
  markRead:         (id: number) => Promise<void>
  heartbeat:        () => Promise<void>
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [], pendingReceived: [], pendingSent: [],
  notifications: [], pendingInvites: [], unreadCount: 0, isLoading: false,

  loadFriends: async () => {
    set({ isLoading: true })
    try {
      const [friends, received, sent] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingIn(),
        friendsApi.getPendingOut(),
      ])
      set({
        friends:         friends.data.data || [],
        pendingReceived: received.data.data || [],
        pendingSent:     sent.data.data || [],
        isLoading: false,
      })
    } catch { set({ isLoading: false }) }
  },

  loadNotifications: async () => {
    try {
      const { data } = await notificationsApi.getAll()
      set({ notifications: data.data || [] })
    } catch {}
  },

  loadPendingInvites: async () => {
    try {
      const { data } = await invitesApi.getPending()
      set({ pendingInvites: data.data || [] })
    } catch {}
  },

  loadUnreadCount: async () => {
    try {
      const { data } = await notificationsApi.getCount()
      set({ unreadCount: data.data?.unreadCount || 0 })
    } catch {}
  },

  sendFriendRequest: async (username) => {
    await friendsApi.sendRequest(username)
    await get().loadFriends()
  },

  acceptFriend: async (id) => {
    await friendsApi.accept(id)
    await get().loadFriends()
  },

  declineFriend: async (id) => {
    await friendsApi.decline(id)
    await get().loadFriends()
  },

  removeFriend: async (id) => {
    await friendsApi.remove(id)
    await get().loadFriends()
  },

  sendInvite: async (username, message, theme) => {
    const { data } = await invitesApi.send({ receiverUsername: username, message, theme })
    return data.data
  },

  respondToInvite: async (id, accepted) => {
    const { data } = await invitesApi.respond(id, accepted)
    await get().loadPendingInvites()
    return data.data || null
  },

  markAllRead: async () => {
    await notificationsApi.markAllRead()
    set((s) => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unreadCount: 0 }))
  },

  markRead: async (id) => {
    await notificationsApi.markRead(id)
    set((s) => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  heartbeat: async () => {
    try { await friendsApi.heartbeat() } catch {}
  },
}))
