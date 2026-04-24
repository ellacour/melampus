import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'Prénom requis'),
    last_name: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    password_confirm: z.string(),
  })
  .refine(data => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore(s => s.setTokens)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiClient.post('/auth/register/', data)
      return response.data
    },
    onSuccess: data => {
      setTokens(data.tokens.access, data.tokens.refresh)
      navigate('/')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>

        {['first_name', 'last_name', 'email', 'password', 'password_confirm'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {field.replace('_', ' ')}
            </label>
            <input
              type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
              {...register(field as keyof RegisterForm)}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {errors[field as keyof RegisterForm] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[field as keyof RegisterForm]?.message}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Création...' : 'Créer mon compte'}
        </button>

        <p className="text-sm text-center text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-emerald-600 font-medium">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  )
}
