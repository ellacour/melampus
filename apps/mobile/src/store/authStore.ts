/**
 * Mobile auth store — uses expo-secure-store for token persistence.
 * Tokens are never stored in AsyncStorage (plaintext).
 */
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'melampus_access'
const REFRESH_KEY = 'melampus_refresh'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  setTokens: (access: string, refresh: string) => Promise<void>
  clearTokens: () => Promise<void>
  loadTokens: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(set => ({
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync(ACCESS_KEY, access)
    await SecureStore.setItemAsync(REFRESH_KEY, refresh)
    set({ isAuthenticated: true, isLoading: false })
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
    set({ isAuthenticated: false, isLoading: false })
  },

  loadTokens: async () => {
    const access = await SecureStore.getItemAsync(ACCESS_KEY)
    set({ isAuthenticated: !!access, isLoading: false })
  },
}))
