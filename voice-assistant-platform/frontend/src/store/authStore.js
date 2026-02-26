import { create } from 'zustand'
import { authAPI } from '../api/client'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: () => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const user = localStorage.getItem('user')
    set({
      accessToken,
      refreshToken,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!accessToken,
    })
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  login: async (username, password) => {
    set({ isLoading: true })
    const { data } = await authAPI.login(username, password)
    get().setTokens(data.access_token, data.refresh_token)
    const me = await authAPI.me()
    localStorage.setItem('user', JSON.stringify(me.data))
    set({ user: me.data, isAuthenticated: true, isLoading: false })
    return me.data
  },

  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken || localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token')
    const { data } = await authAPI.refresh(refreshToken)
    get().setTokens(data.access_token, data.refresh_token)
    return data.access_token
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },
}))
