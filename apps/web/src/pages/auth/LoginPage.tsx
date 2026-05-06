import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { BrandPanel } from '../../components/auth/BrandPanel'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore(s => s.setTokens)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiClient.post('/auth/login/', data)
      return response.data
    },
    onSuccess: data => {
      setTokens(data.access, data.refresh)
      navigate('/')
    },
    onError: () => {
      setError('root', { message: 'Email ou mot de passe incorrect.' })
    },
  })

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_6fr] bg-paper">
      <BrandPanel
        title="Le carnet de santé animale, version numérique."
        subtitle="Suivi vaccinal et soins récurrents, calculés à partir des protocoles vétérinaires français. Multi-espèces, multi-animaux."
      />

      <main className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-3">Connexion</p>
          <h1 className="text-[26px] font-semibold tracking-tightish leading-tight mb-1.5">
            Identifiez-vous.
          </h1>
          <p className="text-sm text-ink-soft mb-8">
            Accédez au dossier de santé de vos animaux.
          </p>

          <form
            onSubmit={handleSubmit(data => mutation.mutate(data))}
            noValidate
          >
            <div className="mb-4">
              <label htmlFor="login-email" className="label">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`input ${errors.email ? 'is-error' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-status-over mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-2">
              <label htmlFor="login-password" className="label">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`input ${errors.password ? 'is-error' : ''}`}
              />
              {errors.password && (
                <p className="text-sm text-status-over mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end mb-5">
              <Link
                to="/forgot-password"
                className="text-sm text-brand-deep hover:underline"
              >
                Mot de passe oublié&nbsp;?
              </Link>
            </div>

            {errors.root && (
              <div className="mb-4 px-3 py-2.5 rounded-sm bg-status-over-tint text-status-over text-sm">
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full h-[46px]"
            >
              {mutation.isPending ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="flex items-center gap-3 my-7 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <span className="flex-1 h-px bg-line" />
              ou
              <span className="flex-1 h-px bg-line" />
            </div>

            <p className="text-center text-sm text-ink-soft">
              Pas encore de compte&nbsp;?{' '}
              <Link to="/register" className="text-brand-deep font-medium hover:underline">
                Créer un compte
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
