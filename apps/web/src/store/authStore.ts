/**
 * Auth store using vanilla state (no external lib dependency for this).
 * Keeps token management isolated from React Query.
 *
 * Single source of truth for tokens — the axios interceptor reads/writes
 * tokens via this store (not localStorage directly), so persistence,
 * refresh, and logout stay coherent.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  updateAccessToken: (access: string) => void
  clearTokens: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      updateAccessToken: access => set({ accessToken: access }),
      clearTokens: () =>
        set({ accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'melampus-auth',
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
