import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = ''

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  let token = useAuthStore.getState().accessToken
  if (!token) {
    token = localStorage.getItem('accessToken')
  }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      original._retry = true
      refreshing = true
      try {
        const token = await useAuthStore.getState().refreshAccessToken()
        processQueue(null, token)
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      } catch (e) {
        processQueue(e, null)
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export const authAPI = {
  login: (username, password) => client.post('/api/auth/login', { username, password }),
  register: (payload) => client.post('/api/auth/register', payload),
  refresh: (refresh_token) => client.post('/api/auth/refresh', { refresh_token }),
  me: () => client.get('/api/auth/me'),
  regenerateApiKey: () => client.post('/api/auth/regenerate-api-key'),
}

export const voiceAPI = {
  startSession: (channel = 'web') => client.post('/api/voice/start-session', { channel }),
  processAudio: (formData) => client.post('/api/voice/process-audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  endSession: (session_id) => client.post('/api/voice/end-session', { session_id }),
  getSessions: (page = 1, limit = 20) => client.get('/api/voice/sessions', { params: { page, limit } }),
}

export const analyticsAPI = {
  getDashboard: () => client.get('/api/analytics/dashboard'),
  getSession: (sessionId) => client.get(`/api/analytics/session/${sessionId}`),
  getSessions: (params) => client.get('/api/analytics/sessions', { params }),
  getFraudAlerts: (params) => client.get('/api/analytics/fraud-alerts', { params }),
  getEmotionTrends: () => client.get('/api/emotion/trends'),
}

export const integrationsAPI = {
  getLogs: (params) => client.get('/api/integrations/logs', { params }),
  getHealth: () => client.get('/api/health'),
}

export default client

const api = client

export const gmlAPI = {
  getStats: () => api.get('/api/gml/stats'),
  recall: (query, topK = 5) => api.post('/api/gml/recall', { query, top_k: topK }),
  query: (question) => api.post('/api/gml/query', { question }),
  ingest: (text, sessionId) => api.post('/api/gml/ingest', { text, session_id: sessionId }),
  getEntities: (params) => api.get('/api/gml/entities', { params }),
  searchEntities: (q) => api.get(`/api/gml/entities/search?q=${encodeURIComponent(q)}`),
  getEntity: (id) => api.get(`/api/gml/entities/${id}`),
  createEntity: (data) => api.post('/api/gml/entities', data),
  forgetEntity: (id) => api.delete(`/api/gml/entities/${id}`),
  getRelationships: (params) => api.get('/api/gml/relationships', { params }),
  getGraph: () => api.get('/api/gml/graph'),
  createRelationship: (data) => api.post('/api/gml/relationships', data),
  forgetRelationship: (id) => api.delete(`/api/gml/relationships/${id}`),
  getTimeline: (limit = 50) => api.get(`/api/gml/events?limit=${limit}`),
  searchEvents: (q, sinceDays) => api.get(`/api/gml/events/search?q=${encodeURIComponent(q)}${sinceDays ? `&since_days=${sinceDays}` : ''}`),
  runDecay: () => api.post('/api/gml/decay/run'),
  resetMemory: () => api.delete('/api/gml/memory/reset'),
  getSnapshots: () => api.get('/api/gml/snapshots'),
}
