/**
 * Mobile login — direction médicale (v1.0).
 * Mark + wordmark en haut, étiquettes mono majuscule, CTA hauteur du pouce,
 * mention HDS / RGPD en pied pour rappeler la nature médicale du service.
 */
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { Mark } from '../../src/components/Mark'
import { apiClient } from '../../src/api/client'
import { useAuthStore } from '../../src/store/authStore'
import { colors, radius, text } from '../../src/theme'

export default function LoginScreen() {
  const router = useRouter()
  const setTokens = useAuthStore(s => s.setTokens)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocus, setEmailFocus] = useState(false)
  const [pwdFocus, setPwdFocus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/auth/login/', { email, password })
      return data
    },
    onSuccess: async data => {
      await setTokens(data.access, data.refresh)
      router.replace('/(tabs)/animals')
    },
    onError: () => setError('Email ou mot de passe incorrect.'),
  })

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Mark size={32} variant="on-paper" withWordmark />

          <View style={{ height: 36 }} />

          <Text style={styles.eyebrow}>Connexion</Text>
          <Text style={styles.title}>Identifiez-vous.</Text>
          <Text style={styles.sub}>Accédez au dossier de santé de vos animaux.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={[styles.input, emailFocus && styles.inputFocus]}
              placeholder="vous@exemple.fr"
              placeholderTextColor={colors.inkSoft}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              style={[styles.input, pwdFocus && styles.inputFocus]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.inkSoft}
            />
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable hitSlop={8} style={styles.forgotWrap}>
              <Text style={styles.forgot}>Mot de passe oublié&nbsp;?</Text>
            </Pressable>
          </Link>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              setError(null)
              mutation.mutate()
            }}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPrimaryPressed,
              mutation.isPending && styles.btnPrimaryDisabled,
            ]}
          >
            <Text style={styles.btnPrimaryText}>
              {mutation.isPending ? 'Connexion…' : 'Se connecter'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.altText}>
              Pas encore de compte&nbsp;?{' '}
              <Link href="/(auth)/register" style={styles.altLink}>
                Créer un compte
              </Link>
            </Text>

            <View style={styles.legalRow}>
              <Text style={styles.legalChip}>HDS</Text>
              <Text style={styles.legalDot}>·</Text>
              <Text style={styles.legalChip}>RGPD</Text>
              <Text style={styles.legalDot}>·</Text>
              <Text style={styles.legalChip}>Chiffré</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40, flexGrow: 1 },

  eyebrow: { ...text.eyebrow, color: colors.inkSoft, marginBottom: 10 },
  title: { ...text.display, color: colors.ink, marginBottom: 6 },
  sub: { ...text.small, color: colors.inkSoft, marginBottom: 28 },

  field: { marginBottom: 14 },
  label: { ...text.label, color: colors.inkSoft, marginBottom: 6 },
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 14,
  },
  inputFocus: { borderColor: colors.brand },

  forgotWrap: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 20 },
  forgot: { fontSize: 13, color: colors.brandDeep, fontWeight: '500' },

  errorBox: {
    backgroundColor: colors.statusOverTint,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    marginBottom: 16,
  },
  errorText: { color: colors.statusOver, fontSize: 13 },

  btnPrimary: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnPrimaryPressed: { backgroundColor: colors.ink },
  btnPrimaryDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.paper, fontSize: 15, fontWeight: '500' },

  footer: { marginTop: 'auto', paddingTop: 24, alignItems: 'center', gap: 14 },
  altText: { fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
  altLink: { color: colors.brandDeep, fontWeight: '500' },

  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legalChip: {
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    fontWeight: '500',
  },
  legalDot: { fontSize: 9, color: colors.inkSoft },
})
