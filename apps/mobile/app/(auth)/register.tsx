/**
 * Mobile register — direction médicale (v1.0).
 * Pendant mobile de apps/web/src/pages/auth/RegisterPage.tsx.
 * Mêmes champs (firstname / lastname / email / password / confirm) pour
 * que les deux plateformes consomment exactement le même endpoint
 * /auth/register/ avec le même contrat (cf. packages/api-types/src/auth.ts).
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

interface FieldErrors {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  password_confirm?: string
  root?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values: {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.first_name.trim()) errors.first_name = 'Prénom requis'
  if (!values.last_name.trim()) errors.last_name = 'Nom requis'
  if (!EMAIL_RE.test(values.email)) errors.email = 'Email invalide'
  if (values.password.length < 8) errors.password = 'Au moins 8 caractères'
  else if (!/\d/.test(values.password)) errors.password = 'Doit contenir un chiffre'
  if (values.password !== values.password_confirm)
    errors.password_confirm = 'Les mots de passe ne correspondent pas'
  return errors
}

export default function RegisterScreen() {
  const router = useRouter()
  const setTokens = useAuthStore(s => s.setTokens)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [focus, setFocus] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/auth/register/', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: passwordConfirm,
      })
      return data
    },
    onSuccess: async data => {
      await setTokens(data.tokens.access, data.tokens.refresh)
      router.replace('/(tabs)/animals')
    },
    onError: () => {
      setErrors(prev => ({
        ...prev,
        root: 'La création du compte a échoué. Vérifiez vos informations.',
      }))
    },
  })

  function submit() {
    const next = validate({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirm: passwordConfirm,
    })
    setErrors(next)
    if (Object.keys(next).length === 0) {
      mutation.mutate()
    }
  }

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

          <Text style={styles.eyebrow}>Inscription · 1 / 1</Text>
          <Text style={styles.title}>Créer un compte.</Text>
          <Text style={styles.sub}>Vous pourrez ajouter vos animaux juste après.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocus('first_name')}
              onBlur={() => setFocus(null)}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              style={[
                styles.input,
                focus === 'first_name' && styles.inputFocus,
                errors.first_name && styles.inputError,
              ]}
              placeholder="Marion"
              placeholderTextColor={colors.inkSoft}
            />
            {errors.first_name && <Text style={styles.errText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocus('last_name')}
              onBlur={() => setFocus(null)}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              style={[
                styles.input,
                focus === 'last_name' && styles.inputFocus,
                errors.last_name && styles.inputError,
              ]}
              placeholder="Gobin"
              placeholderTextColor={colors.inkSoft}
            />
            {errors.last_name && <Text style={styles.errText}>{errors.last_name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocus('email')}
              onBlur={() => setFocus(null)}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={[
                styles.input,
                focus === 'email' && styles.inputFocus,
                errors.email && styles.inputError,
              ]}
              placeholder="vous@exemple.fr"
              placeholderTextColor={colors.inkSoft}
            />
            {errors.email && <Text style={styles.errText}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocus('password')}
              onBlur={() => setFocus(null)}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={[
                styles.input,
                focus === 'password' && styles.inputFocus,
                errors.password && styles.inputError,
              ]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.inkSoft}
            />
            {errors.password ? (
              <Text style={styles.errText}>{errors.password}</Text>
            ) : (
              <Text style={styles.helpText}>Au moins 8 caractères, avec un chiffre.</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmation</Text>
            <TextInput
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              onFocus={() => setFocus('password_confirm')}
              onBlur={() => setFocus(null)}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={[
                styles.input,
                focus === 'password_confirm' && styles.inputFocus,
                errors.password_confirm && styles.inputError,
              ]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.inkSoft}
            />
            {errors.password_confirm && (
              <Text style={styles.errText}>{errors.password_confirm}</Text>
            )}
          </View>

          {errors.root && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{errors.root}</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              setErrors(prev => ({ ...prev, root: undefined }))
              submit()
            }}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPrimaryPressed,
              mutation.isPending && styles.btnPrimaryDisabled,
            ]}
          >
            <Text style={styles.btnPrimaryText}>
              {mutation.isPending ? 'Création…' : 'Créer mon compte'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.altText}>
              Déjà inscrit&nbsp;?{' '}
              <Link href="/(auth)/login" style={styles.altLink}>
                Se connecter
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
  inputError: { borderColor: colors.statusOver },
  errText: { color: colors.statusOver, fontSize: 12, marginTop: 6 },
  helpText: { color: colors.inkSoft, fontSize: 12, marginTop: 6 },

  errorBox: {
    backgroundColor: colors.statusOverTint,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    marginTop: 4,
    marginBottom: 12,
  },
  errorBoxText: { color: colors.statusOver, fontSize: 13 },

  btnPrimary: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
