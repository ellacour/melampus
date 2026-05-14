/**
 * Source unique de la donnée du dashboard.
 *
 * Trois queries parallèles + un /auth/me/ pour le greeting. On ne cherche
 * pas à dériver les agrégats ici — la composition (timeline, schedule,
 * summaries) reste dans dashboard.lib.ts pour rester pure et testable.
 *
 * Pagination : le backend renvoie PaginatedResponse<T> mais sur le
 * dashboard on ne pagine pas — l'utilisateur a typiquement 1-10 animaux,
 * la première page suffit. Quand un compte aura 50+ animaux il faudra
 * une vue dédiée /animals avec virtualisation.
 */
import { useQuery } from '@tanstack/react-query'
import type {
  Animal,
  PaginatedResponse,
  RecurringCare,
  User,
  VaccinationRecord,
} from '@melampus/api-types'
import { apiClient } from '../../api/client'

async function fetchAnimals(): Promise<Animal[]> {
  const { data } = await apiClient.get<PaginatedResponse<Animal>>('/animals/')
  return data.results
}

async function fetchVaccinations(): Promise<VaccinationRecord[]> {
  const { data } =
    await apiClient.get<PaginatedResponse<VaccinationRecord>>('/vaccinations/records/')
  return data.results
}

async function fetchRecurringCare(): Promise<RecurringCare[]> {
  const { data } =
    await apiClient.get<PaginatedResponse<RecurringCare>>('/care/recurring/')
  return data.results
}

async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/')
  return data
}

export interface DashboardQueryState {
  isLoading: boolean
  isFetching: boolean
  error: unknown
  user: User | undefined
  animals: Animal[]
  vaccinations: VaccinationRecord[]
  care: RecurringCare[]
  refetch: () => void
}

export function useDashboard(): DashboardQueryState {
  const me = useQuery({ queryKey: ['auth', 'me'], queryFn: fetchMe })
  const animals = useQuery({ queryKey: ['animals'], queryFn: fetchAnimals })
  const vaccinations = useQuery({
    queryKey: ['vaccinations', 'records'],
    queryFn: fetchVaccinations,
  })
  const care = useQuery({
    queryKey: ['care', 'recurring'],
    queryFn: fetchRecurringCare,
  })

  // « isLoading » au sens dashboard : on attend que la donnée principale
  // (animaux) soit là. Vaccins et soins peuvent encore charger sans bloquer
  // le squelette de la page.
  const isLoading = animals.isLoading || me.isLoading
  const isFetching =
    animals.isFetching ||
    vaccinations.isFetching ||
    care.isFetching ||
    me.isFetching

  const error =
    animals.error ?? vaccinations.error ?? care.error ?? me.error ?? null

  return {
    isLoading,
    isFetching,
    error,
    user: me.data,
    animals: animals.data ?? [],
    vaccinations: vaccinations.data ?? [],
    care: care.data ?? [],
    refetch: () => {
      void animals.refetch()
      void vaccinations.refetch()
      void care.refetch()
    },
  }
}
