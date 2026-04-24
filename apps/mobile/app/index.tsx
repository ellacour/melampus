import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'

export default function Index() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <Redirect href="/(tabs)/animals" /> : <Redirect href="/(auth)/login" />
}
