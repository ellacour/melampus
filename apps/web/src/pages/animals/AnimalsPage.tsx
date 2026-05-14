/**
 * Catalogue détaillé des animaux.
 *
 * Cette page complète la vue d'ensemble (DashboardHomePage) : ici on
 * privilégie la densité plutôt que la lisibilité immédiate, parce que
 * c'est l'endroit où l'utilisateur vient quand il veut filtrer/parcourir
 * un grand nombre de dossiers.
 *
 * Trois états gérés :
 *  - 0 animal total  → carte hero d'onboarding (équivalent au dashboard
 *                       vide, mais formulée côté « catalogue »)
 *  - 0 résultat      → empty inline avec bouton de remise à zéro
 *  - liste peuplée   → tableau dense avec filtres en barre
 *
 * Performance : on garde tout en mémoire (`useMemo`) tant qu'on n'a pas
 * de pagination côté API. La donnée vient de `useDashboard` (clés
 * partagées avec le dashboard, donc pas de double fetch).
 */
import { ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Species } from '@melampus/api-types'
import { AnimalPortrait } from '../dashboard/AnimalCard'
import {
  AnimalSummary,
  EventStatus,
  formatClinical,
  formatPillLabel,
  summarizeAnimal,
} from '../dashboard/dashboard.lib'
import { useDashboard } from '../dashboard/useDashboard'

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

type SpeciesFilter = 'all' | Species
type StatusFilter = 'all' | EventStatus

const SPECIES_FILTER_OPTIONS: ReadonlyArray<{
  value: SpeciesFilter
  label: string
}> = [
  { value: 'all', label: 'Toutes les espèces' },
  { value: 'canine', label: 'Canins' },
  { value: 'feline', label: 'Félins' },
  { value: 'equine', label: 'Équins' },
  { value: 'bovine', label: 'Bovins' },
  { value: 'ovine', label: 'Ovins' },
  { value: 'caprine', label: 'Caprins' },
  { value: 'porcine', label: 'Porcins' },
  { value: 'avian', label: 'Aviaires' },
  { value: 'other', label: 'Autres' },
]

const STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: StatusFilter
  label: string
}> = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'up', label: 'À jour' },
  { value: 'due', label: 'Bientôt dû' },
  { value: 'over', label: 'En retard' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AnimalsPage() {
  const { isLoading, error, animals, vaccinations, care } = useDashboard()
  const [search, setSearch] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const now = useMemo(() => new Date(), [])

  const summaries = useMemo(
    () => animals.map(a => summarizeAnimal(a, vaccinations, care, now)),
    [animals, vaccinations, care, now],
  )

  const filtered = useMemo(() => {
    let list = summaries
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        s =>
          s.animal.name.toLowerCase().includes(q) ||
          (s.animal.breed ?? '').toLowerCase().includes(q) ||
          s.animal.species_display.toLowerCase().includes(q) ||
          (s.animal.identification_number ?? '').toLowerCase().includes(q),
      )
    }
    if (speciesFilter !== 'all') {
      list = list.filter(s => s.animal.species === speciesFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter)
    }
    return [...list].sort((a, b) =>
      a.animal.name.localeCompare(b.animal.name, 'fr'),
    )
  }, [summaries, search, speciesFilter, statusFilter])

  // Comptage agrégé pour le header (sur la liste non filtrée)
  const stats = useMemo(() => aggregateStats(summaries), [summaries])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (summaries.length === 0) return <FullEmpty />

  const filtersActive =
    search.trim() !== '' || speciesFilter !== 'all' || statusFilter !== 'all'

  return (
    <div>
      <Header total={summaries.length} stats={stats} />

      <Filters
        search={search}
        onSearch={setSearch}
        speciesFilter={speciesFilter}
        onSpeciesFilter={setSpeciesFilter}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        resultCount={filtered.length}
        totalCount={summaries.length}
      />

      {filtered.length === 0 ? (
        <NoResults
          hasFilters={filtersActive}
          onReset={() => {
            setSearch('')
            setSpeciesFilter('all')
            setStatusFilter('all')
          }}
        />
      ) : (
        <AnimalsTable summaries={filtered} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

interface AggregatedStats {
  speciesCount: number
  departmentCount: number
  statusBreakdown: Record<EventStatus, number>
}

function aggregateStats(summaries: AnimalSummary[]): AggregatedStats {
  const species = new Set<string>()
  const departments = new Set<string>()
  const status: Record<EventStatus, number> = { up: 0, due: 0, over: 0 }
  for (const s of summaries) {
    species.add(s.animal.species)
    if (s.animal.department_code) departments.add(s.animal.department_code)
    status[s.status]++
  }
  return {
    speciesCount: species.size,
    departmentCount: departments.size,
    statusBreakdown: status,
  }
}

function Header({ total, stats }: { total: number; stats: AggregatedStats }) {
  return (
    <header className="flex items-end justify-between gap-6 mb-8">
      <div>
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-3">
          Catalogue · {String(total).padStart(2, '0')} dossier
          {total > 1 ? 's' : ''} · {stats.speciesCount} espèce
          {stats.speciesCount > 1 ? 's' : ''}
          {stats.departmentCount > 0 && (
            <> · {stats.departmentCount} département{stats.departmentCount > 1 ? 's' : ''}</>
          )}
        </span>
        <h1 className="text-[36px] font-semibold tracking-[-0.025em] leading-[1.1]">
          Mes animaux.
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-2 self-end">
        {stats.statusBreakdown.over > 0 && (
          <StatBadge status="over" count={stats.statusBreakdown.over}>
            en retard
          </StatBadge>
        )}
        {stats.statusBreakdown.due > 0 && (
          <StatBadge status="due" count={stats.statusBreakdown.due}>
            bientôt dû
          </StatBadge>
        )}
        {stats.statusBreakdown.up > 0 && (
          <StatBadge status="up" count={stats.statusBreakdown.up}>
            à jour
          </StatBadge>
        )}
      </div>
    </header>
  )
}

function StatBadge({
  status,
  count,
  children,
}: {
  status: EventStatus
  count: number
  children: ReactNode
}) {
  const dot =
    status === 'over'
      ? 'bg-status-over'
      : status === 'due'
        ? 'bg-status-due'
        : 'bg-status-up'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-line bg-white text-[11.5px]">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <strong className="font-mono text-[12px] text-ink">
        {String(count).padStart(2, '0')}
      </strong>
      <span className="text-ink-soft">{children}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function Filters({
  search,
  onSearch,
  speciesFilter,
  onSpeciesFilter,
  statusFilter,
  onStatusFilter,
  resultCount,
  totalCount,
}: {
  search: string
  onSearch: (v: string) => void
  speciesFilter: SpeciesFilter
  onSpeciesFilter: (v: SpeciesFilter) => void
  statusFilter: StatusFilter
  onStatusFilter: (v: StatusFilter) => void
  resultCount: number
  totalCount: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-line">
      <div className="relative flex-1 min-w-[240px] max-w-[360px]">
        <svg
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Rechercher · nom, race, identification…"
          className="input pl-9"
          autoComplete="off"
        />
      </div>

      <FilterSelect
        value={speciesFilter}
        onChange={v => onSpeciesFilter(v as SpeciesFilter)}
        options={SPECIES_FILTER_OPTIONS}
      />
      <FilterSelect
        value={statusFilter}
        onChange={v => onStatusFilter(v as StatusFilter)}
        options={STATUS_FILTER_OPTIONS}
      />

      <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
        {resultCount === totalCount
          ? `${String(totalCount).padStart(2, '0')} résultat${totalCount > 1 ? 's' : ''}`
          : `${String(resultCount).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}`}
      </span>
    </div>
  )
}

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="input w-auto pr-9 max-w-[180px]"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function AnimalsTable({ summaries }: { summaries: AnimalSummary[] }) {
  return (
    <div className="rounded-md border border-line bg-white overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_140px_40px] items-center px-5 py-3.5 bg-paper border-b border-line font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft">
        <span>Animal</span>
        <span>Identification</span>
        <span>Dernière admin.</span>
        <span>Prochaine</span>
        <span>Statut</span>
        <span />
      </div>

      {summaries.map(summary => (
        <AnimalRow key={summary.animal.id} summary={summary} />
      ))}
    </div>
  )
}

function AnimalRow({ summary }: { summary: AnimalSummary }) {
  const { animal, status, nextEvent, lastAdministeredAt } = summary

  const speciesLine = [
    animal.species_display,
    animal.age_in_months != null ? formatAge(animal.age_in_months) : null,
    animal.breed || null,
  ]
    .filter((v): v is string => !!v)
    .join(' · ')

  const pillClass =
    status === 'up' ? 'pill-up' : status === 'due' ? 'pill-due' : 'pill-over'

  const pillLabel = nextEvent
    ? formatPillLabel(status, nextEvent.daysFromToday)
    : 'À jour'

  return (
    <Link
      to={`/animals/${animal.id}`}
      className="grid grid-cols-[2.2fr_140px] md:grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_140px_40px] items-center px-5 py-4 border-b border-line last:border-b-0 hover:bg-paper transition-colors no-underline group"
    >
      {/* Animal */}
      <div className="flex items-center gap-3.5 min-w-0">
        <AnimalPortrait species={animal.species} />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.012em] text-ink leading-tight truncate">
            {animal.name}
          </div>
          <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft truncate">
            {speciesLine}
          </div>
        </div>
      </div>

      {/* Identification — hidden on mobile */}
      <div className="hidden md:block min-w-0">
        <div className="font-mono text-[12px] text-ink truncate">
          {animal.identification_number || '—'}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
          Dpt {animal.department_code || '—'}
        </div>
      </div>

      {/* Dernière admin */}
      <div className="hidden md:block font-mono text-[12px] text-ink">
        {lastAdministeredAt ? formatClinical(lastAdministeredAt) : '—'}
      </div>

      {/* Prochaine */}
      <div className="hidden md:block">
        <div className="font-mono text-[12px] text-ink">
          {nextEvent ? formatClinical(nextEvent.dueAt) : '—'}
        </div>
        {nextEvent && (
          <div
            className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${
              status === 'over'
                ? 'text-status-over'
                : status === 'due'
                  ? 'text-status-due'
                  : 'text-ink-soft'
            }`}
          >
            {nextEvent.protocol}
          </div>
        )}
      </div>

      {/* Statut */}
      <div className="justify-self-start md:justify-self-auto">
        <span className={`${pillClass} whitespace-nowrap`}>{pillLabel}</span>
      </div>

      {/* Arrow */}
      <svg
        className="hidden md:block justify-self-end text-line-strong transition-transform group-hover:translate-x-0.5 group-hover:text-brand-deep"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// États vides & autres
// ---------------------------------------------------------------------------

function FullEmpty() {
  return (
    <div className="max-w-[760px]">
      <header className="mb-10">
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-3">
          Catalogue · vide
        </span>
        <h1 className="text-[36px] font-semibold tracking-[-0.025em] leading-[1.1] mb-2">
          Mes animaux.
        </h1>
        <p className="text-[15px] text-ink-soft max-w-[540px]">
          Votre catalogue est vide. Ajoutez un premier animal — le calendrier
          vaccinal se construira automatiquement à partir des protocoles
          vétérinaires français.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-lg border border-brand/15 bg-brand-tint px-10 py-10">
        <span
          aria-hidden
          className="pointer-events-none absolute top-7 right-9 h-[36px] w-[110px] opacity-[.18] bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url("${encodeURI(
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><path d='M5 30 L40 30 L52 8 L72 52 L92 8 L112 30 L195 30' stroke='%230E5B45' stroke-width='2.5' fill='none' stroke-linecap='square' stroke-linejoin='miter'/></svg>",
            )}")`,
          }}
        />

        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep mb-3">
          Premier dossier
        </p>
        <h2 className="text-[24px] font-semibold tracking-[-0.02em] leading-[1.18] mb-2 max-w-[420px]">
          Ouvrez le dossier de votre premier animal.
        </h2>
        <p className="text-[14px] text-ink-soft leading-relaxed max-w-[460px] mb-6">
          Renseignez l'espèce, l'âge et le département. Vos rappels seront
          calculés automatiquement.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link
            to="/animals/new"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-sm bg-brand-deep text-paper font-medium text-sm transition-colors hover:bg-ink no-underline"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter un animal
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-brand-deep hover:underline"
          >
            Retour à la vue d'ensemble
          </Link>
        </div>
      </section>
    </div>
  )
}

function NoResults({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean
  onReset: () => void
}) {
  return (
    <div className="rounded-md border border-line bg-white p-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft mb-2">
        Aucun résultat
      </p>
      <p className="text-ink mb-5 max-w-[420px] mx-auto">
        {hasFilters
          ? "Aucun animal ne correspond à ces filtres. Essayez d'élargir la recherche."
          : 'Aucun animal à afficher pour le moment.'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onReset} className="btn-secondary">
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div>
      <header className="mb-8">
        <div className="h-3 w-40 bg-line rounded-sm mb-3 animate-pulse" />
        <div className="h-9 w-60 bg-line rounded-sm animate-pulse" />
      </header>
      <div className="h-11 bg-line rounded-sm mb-5 animate-pulse" />
      <div className="h-[280px] bg-white border border-line rounded-md animate-pulse" />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="rounded-md border border-status-over/40 bg-status-over-tint/40 p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-status-over mb-2">
        Erreur de chargement
      </p>
      <p className="text-ink mb-4">
        Le catalogue n'a pas pu être récupéré. Vérifiez votre connexion et
        réessayez.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-secondary"
      >
        Réessayer
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAge(months: number): string {
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'an' : 'ans'}`
}
