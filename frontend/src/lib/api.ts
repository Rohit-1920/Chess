import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ─── Response Interceptor — handle 401 with refresh ──────────────────────────

let isRefreshing = false
let pendingQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
        const newToken = data.data.accessToken

        localStorage.setItem('accessToken', newToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)

        pendingQueue.forEach((p) => p.resolve(newToken))
        pendingQueue = []

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (e) {
        pendingQueue.forEach((p) => p.reject(e))
        pendingQueue = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email?: string; phone?: string; username: string
    password: string; displayName?: string
  }) => api.post('/auth/register', data),

  login: (data: { identifier: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),

  me: () => api.get('/auth/me'),
}

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const userApi = {
  getMyProfile: () => api.get('/users/me'),

  updateProfile: (data: {
    username?: string; displayName?: string
    avatarUrl?: string; preferredTheme?: string
  }) => api.put('/users/me', data),

  getPublicProfile: (username: string) => api.get(`/users/${username}`),
}

// ─── Game Endpoints ───────────────────────────────────────────────────────────

export const gameApi = {
  createGame: (data: {
    gameMode: string; aiDifficulty?: string
    aiPlaysAs?: string; theme?: string; opponentUsername?: string
  }) => api.post('/games', data),

  joinGame: (gameId: number) => api.post(`/games/${gameId}/join`),

  getGame: (gameId: number) => api.get(`/games/${gameId}`),

  makeMove: (gameId: number, data: {
    fromSquare: string; toSquare: string; promotionPiece?: string
  }) => api.post(`/games/${gameId}/moves`, data),

  getMoves: (gameId: number) => api.get(`/games/${gameId}/moves`),

  resign: (gameId: number) => api.post(`/games/${gameId}/resign`),

  getMyGames: (page = 0, size = 20) =>
    api.get(`/games/my?page=${page}&size=${size}`),

  getLobby: () => api.get('/games/lobby'),
}

export default api
