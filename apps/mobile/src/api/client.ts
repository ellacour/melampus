/**
 * Axios client mobile.
 * - Base URL : `extra.apiUrl` depuis app.json (configurable par EAS environments).
 * - Token management : SecureStore via le store Zustand (single source of truth).
 * - Refresh : à 401, on tente un refresh une fois, sinon on déconnecte.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const ACCESS_KEY = 'melampus_access'
const REFRESH_KEY = 'melampus_refresh'

const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: `${baseURL.replace(/\/$/, '')}`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

const AUTH_PATHS = ['/auth/login/', '/auth/register/', '/auth/refresh/']

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const access = await SecureStore.getItemAsync(ACCESS_KEY)
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

let isRefreshing = false

apiClient.interceptors.response.use(
  r => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (!original || original._retry) return Promise.reject(error)
    if (AUTH_PATHS.some(p => original.url?.includes(p))) return Promise.reject(error)
    if (error.response?.status !== 401) return Promise.reject(error)

    if (isRefreshing) return Promise.reject(error)
    isRefreshing = true
    original._retry = true

    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY)
      if (!refresh) throw new Error('no refresh token')
      const { data } = await axios.post(`${baseURL.replace(/\/$/, '')}/auth/refresh/`, {
        refresh,
      })
      await SecureStore.setItemAsync(ACCESS_KEY, data.access)
      if (original.headers) original.headers.Authorization = `Bearer ${data.access}`
      return apiClient(original)
    } catch (e) {
      await SecureStore.deleteItemAsync(ACCESS_KEY)
      await SecureStore.deleteItemAsync(REFRESH_KEY)
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  },
)
