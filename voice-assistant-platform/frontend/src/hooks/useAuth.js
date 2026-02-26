import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export default function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    store.initialize()
  }, [])

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    logout: store.logout,
    refreshAccessToken: store.refreshAccessToken,
  }
}
