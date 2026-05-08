import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserProfile } from '@/types'
import { authApi, userApi } from '@/lib/api'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean

  login: (identifier: string, password: string) => Promise<void>
  register: (data: {
    email?: string; phone?: string; username: string
    password: string; displayName?: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      isAuthenticated: () => !!get().accessToken && !!get().user,

      setTokens: (access, refresh) => {
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        set({ accessToken: access, refreshToken: refresh })
      },

      login: async (identifier, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ identifier, password })
          const { accessToken, refreshToken, user } = data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          set({ user, accessToken, refreshToken, isLoading: false })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      register: async (formData) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData)
          const { accessToken, refreshToken, user } = data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          set({ user, accessToken, refreshToken, isLoading: false })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch (_) {}
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refreshProfile: async () => {
        try {
          const { data } = await userApi.getMyProfile()
          set({ user: data.data })
        } catch (_) {}
      },
    }),
    {
      name: 'chess-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
