import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WebSocketMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'

class ChessWebSocketClient {
  private client: Client | null = null
  private subscriptions: Map<string, () => void> = new Map()

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 3000,
        onConnect: () => {
          console.log('[WS] Connected')
          resolve()
        },
        onStompError: (frame) => {
          console.error('[WS] STOMP error:', frame)
          reject(new Error(frame.headers?.message || 'WebSocket error'))
        },
        onDisconnect: () => {
          console.log('[WS] Disconnected')
        },
      })
      this.client.activate()
    })
  }

  disconnect() {
    this.subscriptions.forEach((unsub) => unsub())
    this.subscriptions.clear()
    this.client?.deactivate()
    this.client = null
  }

  subscribeToGame(gameId: number, onMessage: (msg: WebSocketMessage) => void): () => void {
    if (!this.client?.connected) {
      console.warn('[WS] Not connected — cannot subscribe')
      return () => {}
    }

    const destination = `/topic/game/${gameId}`
    const sub = this.client.subscribe(destination, (frame: IMessage) => {
      try {
        const msg: WebSocketMessage = JSON.parse(frame.body)
        onMessage(msg)
      } catch (e) {
        console.error('[WS] Failed to parse message:', e)
      }
    })

    const unsub = () => sub.unsubscribe()
    this.subscriptions.set(destination, unsub)
    return unsub
  }

  subscribeToErrors(onError: (msg: WebSocketMessage) => void): () => void {
    if (!this.client?.connected) return () => {}

    const destination = '/user/queue/errors'
    const sub = this.client.subscribe(destination, (frame: IMessage) => {
      try {
        const msg: WebSocketMessage = JSON.parse(frame.body)
        onError(msg)
      } catch (e) {
        console.error('[WS] Failed to parse error:', e)
      }
    })

    const unsub = () => sub.unsubscribe()
    this.subscriptions.set(destination, unsub)
    return unsub
  }

  sendMove(gameId: number, fromSquare: string, toSquare: string, promotionPiece?: string) {
    this.client?.publish({
      destination: `/app/game/${gameId}/move`,
      body: JSON.stringify({ fromSquare, toSquare, promotionPiece }),
    })
  }

  joinGame(gameId: number) {
    this.client?.publish({
      destination: `/app/game/${gameId}/join`,
      body: '',
    })
  }

  resign(gameId: number) {
    this.client?.publish({
      destination: `/app/game/${gameId}/resign`,
      body: '',
    })
  }

  sendChat(gameId: number, message: string) {
    this.client?.publish({
      destination: `/app/game/${gameId}/chat`,
      body: message,
    })
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

// Singleton
export const wsClient = new ChessWebSocketClient()
