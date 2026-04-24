import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'

export function AnimalsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data } = await apiClient.get('/animals/')
      return data
    },
  })

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur lors du chargement des animaux.</div>

  return (
    <div>
      <h1>Mes animaux</h1>
      {/* List and detail components to be built here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
