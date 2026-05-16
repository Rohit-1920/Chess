import api from './api'

export const friendsApi = {
  getFriends:       ()           => api.get('/friends'),
  getPendingIn:     ()           => api.get('/friends/pending/received'),
  getPendingOut:    ()           => api.get('/friends/pending/sent'),
  sendRequest:      (username: string) => api.post('/friends/request', { username }),
  accept:           (id: number) => api.post(`/friends/${id}/accept`),
  decline:          (id: number) => api.delete(`/friends/${id}/decline`),
  remove:           (id: number) => api.delete(`/friends/${id}`),
  search:           (q: string)  => api.get(`/friends/search?q=${encodeURIComponent(q)}`),
  heartbeat:        ()           => api.post('/friends/heartbeat'),
}

export const invitesApi = {
  send:        (data: { receiverUsername: string; message?: string; theme?: string }) =>
                 api.post('/invites', data),
  respond:     (id: number, accepted: boolean) =>
                 api.post(`/invites/${id}/respond`, { accepted }),
  cancel:      (id: number) => api.delete(`/invites/${id}/cancel`),
  getAll:      ()           => api.get('/invites'),
  getPending:  ()           => api.get('/invites/pending'),
}

export const notificationsApi = {
  getAll:      ()           => api.get('/notifications'),
  getUnread:   ()           => api.get('/notifications/unread'),
  getCount:    ()           => api.get('/notifications/count'),
  markRead:    (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: ()           => api.put('/notifications/read-all'),
}
