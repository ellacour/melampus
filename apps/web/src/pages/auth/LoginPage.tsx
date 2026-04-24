import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
