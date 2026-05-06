import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { BrandPanel } from '../../components/auth/BrandPanel'

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis'),
    last_name: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/\d/, 'Doit contenir un chiffre'),
    password_confirm: z.string(),
  })
  .refine(data => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const REGISTER_FEATURES = [
  {
    num: '01',
    title: 'Données structurées dès le jour 1.',
    text: 'Fini les notes éparpillées dans des SMS.',
  },
  {
    num: '02',
    title: 'Export PDF du carnet.',
    text: 'Pour le véto, l\'assurance, la frontière.',
  },
  {
    num: '03',
    title: 'Notifications avant échéance.',
    text: '30, 7, et 0 jour.',
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore(s => s.setTokens)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiClient.post('/auth/register/', data)
      return response.data
    },
    onSuccess: data => {
      setTokens(data.tokens.access, data.tokens.refresh)
      navigate('/')
    },
    onError: () => {
      setError('root', {
        message: 'La création du compte a échoué. Vérifiez vos informations.',
      })
    },
  })

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_6fr] bg-paper">
      <BrandPanel
        title="Ouvrez le dossier numérique de vos animaux."
        subtitle="Trois minutes d'inscription. Aucune carte bancaire. Vos données restent vos données."
        features={REGISTER_FEATURES}
      />

      <main className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-3">Inscription · 1 / 1</p>
          <h1 className="text-[26px] font-semibold tracking-tightish leading-tight mb-1.5">
            Créer un compte.
          </h1>
          <p className="text-sm text-ink-soft mb-8">
            Vous pourrez ajouter vos animaux juste après.
          </p>

          <form onSubmit={handleSubmit(data => mutation.mutate(data))} noValidate>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="first-name" className="label">Prénom</label>
                <input
                  id="first-name"
                  type="text"
                  autoComplete="given-name"
                  {...register('first_name')}
                  className={`input ${errors.first_name ? 'is-error' : ''}`}
                />
                {errors.first_name && (
                  <p className="text-sm text-status-over mt-1.5">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="last-name" className="label">Nom</label>
                <input
                  id="last-name"
                  type="text"
                  autoComplete="family-name"
                  {...register('last_name')}
                  className={`input ${errors.last_name ? 'is-error' : ''}`}
                />
                {errors.last_name && (
                  <p className="text-sm text-status-over mt-1.5">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="register-email" className="label">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`input ${errors.email ? 'is-error' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-status-over mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="register-password" className="label">Mot de passe</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={`input ${errors.password ? 'is-error' : ''}`}
              />
              {errors.password ? (
                <p className="text-sm text-status-over mt-1.5">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-ink-soft mt-1.5">
                  Au moins 8 caractères, avec un chiffre.
                </p>
              )}
            </div>

            <div className="mb-2">
              <label htmlFor="register-password-confirm" className="label">
                Confirmation
              </label>
              <input
                id="register-password-confirm"
                type="password"
                autoComplete="new-password"
                {...register('password_confirm')}
                className={`input ${errors.password_confirm ? 'is-error' : ''}`}
              />
              {errors.password_confirm && (
                <p className="text-sm text-status-over mt-1.5">
                  {errors.password_confirm.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="mt-4 px-3 py-2.5 rounded-sm bg-status-over-tint text-status-over text-sm">
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full h-[46px] mt-4"
            >
              {mutation.isPending ? 'Création…' : 'Créer mon compte'}
            </button>

            <p className="text-center text-sm text-ink-soft mt-6">
              Déjà inscrit&nbsp;?{' '}
              <Link to="/login" className="text-brand-deep font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
