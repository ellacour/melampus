/**
 * Fiche détaillée d'un animal — `/animals/:id`.
 *
 * C'est le « dossier complet » d'un animal : identité, chronologie
 * clinique filtrée, historique vaccinal, soins récurrents, notes. Pensé
 * comme un carnet — empilement de sections, peu de chrome, beaucoup
 * d'information.
 *
 * Data : on réutilise `useDashboard` (cache partagé). Quand l'utilisateur
 * arrive directement par URL (bookmark), le hook fetch les trois listes ;
 * sinon la navigation depuis le dashboard ou la liste est instantanée.
 *
 * Quatre états gérés :
 *  - chargement initial
 *  - erreur API
 *  - animal introuvable (404 logique)
 *  - dossier peuplé
 */
import { ReactNode, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  Animal,
  RecurringCare,
  VaccinationRecord,
} from '@melampus/api-types'
import { AnimalPortrait } from '../dashboard/AnimalCard'
import { Chronologie } from '../dashboard/Chronologie'
import {
  AnimalSummary,
  buildAllEvents,
  EventStatus,
  formatClinical,
  formatPillLabel,
  selectTimelineEvents,
  summarizeAnimal,
} from '../dashboard/dashboard.lib'
import { useDashboard } from '../dashboard/useDashboard'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { animals, vaccinations, care, isLoading, error } = useDashboard()

  const now = useMemo(() => new Date(), [])

  const animal = useMemo(
    () => animals.find(a => a.id === id),
    [animals, id],
  )
  const animalVaccinations = useMemo(
    () => vaccinations.filter(v => v.animal === id),
    [vaccinations, id],
  )
  const animalCare = useMemo(
    () => care.filter(c => c.animal === id),
    [care, id],
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  if (!animal) return <NotFoundState id={id} />

  const summary = summarizeAnimal(animal, animalVaccinations, animalCare, now)
  const allEvents = buildAllEvents(
    [animal],
    animalVaccinations,
    animalCare,
    now,
  )
  const timelineEvents = selectTimelineEvents(allEvents)

  return (
    <div className="max-w-[1100px]">
      <BackLink />
      <DetailHero animal={animal} summary={summary} />
      <IdentitySection animal={animal} />
      <ChronologieSection
        events={timelineEvents}
        animalName={animal.name}
        now={now}
      />
      <VaccinationsSection records={animalVaccinations} animalName={animal.name} />
      <CareSection cares={animalCare} animalName={animal.name} />
      <NotesSection notes={animal.notes} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Back link
// ---------------------------------------------------------------------------

function BackLink() {
  return (
    <Link
      to="/animals"
      className="inline-flex items-center gap-2 mb-6 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink no-underline transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Retour aux animaux
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Hero — portrait + nom + statut + actions
// ---------------------------------------------------------------------------

function DetailHero({
  animal,
  summary,
}: {
  animal: Animal
  summary: AnimalSummary
}) {
  const navigate = useNavigate()
  const { status, nextEvent } = summary
  const days = nextEvent?.daysFromToday ?? 0
  const pillLabel = nextEvent ? formatPillLabel(status, days) : 'À jour'
  const pillClass = pillClassFor(status)

  const speciesLine = identityLine(animal)

  return (
    <header className="flex items-start justify-between gap-8 mb-10 pb-10 border-b border-line">
      <div className="flex items-start gap-6 min-w-0">
        <AnimalPortrait species={animal.species} size="lg" />
        <div className="min-w-0">
          <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-2">
            Dossier · {animal.identification_number || 'Non identifié'}
          </span>
          <h1 className="text-[40px] font-semibold tracking-[-0.025em] leading-[1.02] mb-3">
            {animal.name}.
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`${pillClass} whitespace-nowrap`}>{pillLabel}</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-ink-soft">
              {speciesLine}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button type="button" className="btn-secondary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Exporter PDF
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate(`/animals/${animal.id}/edit`)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Modifier
        </button>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// 01 — Identité (grid 2 colonnes de stats)
// ---------------------------------------------------------------------------

function IdentitySection({ animal }: { animal: Animal }) {
  return (
    <DocSection title="Identité" badge="01" mb="mb-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 rounded-md border border-line bg-white p-8">
        <Field label="Nom courant">{animal.name}</Field>
        <Field label="Espèce">{animal.species_display || '—'}</Field>
        <Field label="Sexe">{animal.gender_display || '—'}</Field>
        <Field label="Race">{animal.breed || '—'}</Field>
        <Field label="Date de naissance">
          {animal.birth_date ? formatClinical(new Date(animal.birth_date)) : '—'}
        </Field>
        <Field label="Âge">
          {animal.age_in_months != null
            ? formatAge(animal.age_in_months)
            : '—'}
        </Field>
        <Field label="Numéro d'identification" mono>
          {animal.identification_number || '—'}
        </Field>
        <Field label="Département">
          {animal.department_code || '—'}
        </Field>
      </div>
    </DocSection>
  )
}

function Field({
  label,
  children,
  mono,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-1">
        {label}
      </div>
      <div
        className={
          mono
            ? 'font-mono text-[13px] text-ink'
            : 'text-[14px] text-ink leading-snug'
        }
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 02 — Chronologie
// ---------------------------------------------------------------------------

function ChronologieSection({
  events,
  animalName,
  now,
}: {
  events: ReturnType<typeof selectTimelineEvents>
  animalName: string
  now: Date
}) {
  if (events.length === 0) {
    return (
      <DocSection title="Chronologie clinique" badge="02" mb="mb-14">
        <EmptyCard
          title="Aucune échéance dans la fenêtre courante."
          body={`${animalName} n'a aucun rappel sur les −14 / +30 prochains jours. Les protocoles à venir s'afficheront ici dès leur calcul.`}
        />
      </DocSection>
    )
  }

  return (
    <DocSection title="Chronologie clinique" badge="02" mb="mb-14">
      {/* On délègue la frise au composant du dashboard — il est paramétré
          par events / now uniquement, donc directement réutilisable. */}
      <Chronologie events={events} now={now} />
    </DocSection>
  )
}

// ---------------------------------------------------------------------------
// 03 — Vaccinations
// ---------------------------------------------------------------------------

function VaccinationsSection({
  records,
  animalName,
}: {
  records: VaccinationRecord[]
  animalName: string
}) {
  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.administered_at).getTime() -
      new Date(a.administered_at).getTime(),
  )

  return (
    <DocSection
      title="Vaccinations"
      badge="03"
      count={records.length}
      action={{ label: '+ Enregistrer une vaccination', to: '#' }}
      mb="mb-14"
    >
      {sorted.length === 0 ? (
        <EmptyCard
          title="Aucune vaccination enregistrée."
          body={`Enregistrez la première administration pour ${animalName}. Le calendrier vaccinal calculera automatiquement les rappels à partir du protocole choisi.`}
          cta={{ label: 'Enregistrer une vaccination', to: '#' }}
        />
      ) : (
        <div className="rounded-md border border-line bg-white overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_140px] items-center px-5 py-3.5 bg-paper border-b border-line font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft">
            <span>Vaccin</span>
            <span>Administré le</span>
            <span>Par</span>
            <span>Prochaine</span>
            <span>Statut</span>
          </div>
          {sorted.map(record => (
            <VaccinationRow key={record.id} record={record} />
          ))}
        </div>
      )}
    </DocSection>
  )
}

function VaccinationRow({ record }: { record: VaccinationRecord }) {
  const administered = new Date(record.administered_at)
  const nextDue = record.next_due_at ? new Date(record.next_due_at) : null

  // Map statut backend → pill clinique
  const pillStatus: EventStatus =
    record.status === 'overdue'
      ? 'over'
      : record.status === 'due_soon'
        ? 'due'
        : 'up'
  const pillClass = pillClassFor(pillStatus)
  const pillLabel = record.status === 'not_applicable' ? 'N/A' : statusLabel(pillStatus, nextDue)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1.2fr_1.2fr_140px] items-center gap-y-1 px-5 py-4 border-b border-line last:border-b-0">
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-ink">
          {record.vaccine_name}
        </div>
        {record.rule != null && (
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
            VAC.{record.rule}
            {record.batch_number ? ` · Lot ${record.batch_number}` : ''}
          </div>
        )}
      </div>
      <div className="font-mono text-[12px] text-ink">
        {formatClinical(administered)}
      </div>
      <div className="text-[13px] text-ink-soft truncate">
        {record.administered_by || '—'}
      </div>
      <div className="font-mono text-[12px] text-ink">
        {nextDue ? formatClinical(nextDue) : '—'}
      </div>
      <div>
        {record.status === 'not_applicable' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[11px] font-medium tracking-[0.04em] bg-paper text-ink-soft border border-line">
            N/A
          </span>
        ) : (
          <span className={`${pillClass} whitespace-nowrap`}>{pillLabel}</span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 04 — Soins récurrents
// ---------------------------------------------------------------------------

function CareSection({
  cares,
  animalName,
}: {
  cares: RecurringCare[]
  animalName: string
}) {
  const sorted = [...cares].sort((a, b) => {
    // Actifs d'abord, puis par prochaine échéance croissante.
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    const da = a.next_due_at ? new Date(a.next_due_at).getTime() : Infinity
    const db = b.next_due_at ? new Date(b.next_due_at).getTime() : Infinity
    return da - db
  })

  return (
    <DocSection
      title="Soins récurrents"
      badge="04"
      count={cares.length}
      action={{ label: '+ Ajouter un soin', to: '#' }}
      mb="mb-14"
    >
      {sorted.length === 0 ? (
        <EmptyCard
          title="Aucun soin récurrent configuré."
          body={`Configurez un cycle (vermifugation, dentaire, maréchalerie…) pour que ${animalName} reçoive les rappels automatiquement.`}
          cta={{ label: 'Ajouter un soin', to: '#' }}
        />
      ) : (
        <div className="rounded-md border border-line bg-white overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.2fr_1.2fr_140px] items-center px-5 py-3.5 bg-paper border-b border-line font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft">
            <span>Soin</span>
            <span>Fréquence</span>
            <span>Dernier</span>
            <span>Prochain</span>
            <span>Statut</span>
          </div>
          {sorted.map(c => (
            <CareRow key={c.id} care={c} />
          ))}
        </div>
      )}
    </DocSection>
  )
}

function CareRow({ care }: { care: RecurringCare }) {
  const lastDone = care.last_done_at ? new Date(care.last_done_at) : null
  const nextDue = care.next_due_at ? new Date(care.next_due_at) : null
  const pillStatus: EventStatus =
    care.status === 'overdue'
      ? 'over'
      : care.status === 'pending'
        ? 'due'
        : 'up'
  const pillClass = pillClassFor(pillStatus)
  const pillLabel = !care.is_active
    ? 'Inactif'
    : care.status === 'done'
      ? 'À jour'
      : statusLabel(pillStatus, nextDue)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.2fr_1.2fr_140px] items-center gap-y-1 px-5 py-4 border-b border-line last:border-b-0">
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-ink">{care.name}</div>
        {care.description && (
          <div className="mt-0.5 text-[12.5px] text-ink-soft line-clamp-1">
            {care.description}
          </div>
        )}
      </div>
      <div className="font-mono text-[12px] text-ink">
        {care.frequency_display ||
          `${care.frequency_value} ${care.frequency_unit}`}
      </div>
      <div className="font-mono text-[12px] text-ink">
        {lastDone ? formatClinical(lastDone) : '—'}
      </div>
      <div className="font-mono text-[12px] text-ink">
        {nextDue ? formatClinical(nextDue) : '—'}
      </div>
      <div>
        {!care.is_active ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[11px] font-medium tracking-[0.04em] bg-paper text-ink-soft border border-line">
            Inactif
          </span>
        ) : (
          <span className={`${pillClass} whitespace-nowrap`}>{pillLabel}</span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 05 — Notes
// ---------------------------------------------------------------------------

function NotesSection({ notes }: { notes: string }) {
  return (
    <DocSection title="Notes" badge="05" mb="mb-10">
      {notes && notes.trim() ? (
        <div className="rounded-md border border-line bg-white p-6">
          <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
            {notes}
          </p>
        </div>
      ) : (
        <EmptyCard
          title="Aucune note."
          body="Vous pouvez consigner ici tout ce que vous voulez garder en mémoire — visible uniquement par vous."
        />
      )}
    </DocSection>
  )
}

// ---------------------------------------------------------------------------
// Sous-blocs partagés
// ---------------------------------------------------------------------------

function DocSection({
  title,
  badge,
  count,
  action,
  mb,
  children,
}: {
  title: string
  badge: string
  count?: number
  action?: { label: string; to: string }
  mb?: string
  children: ReactNode
}) {
  return (
    <section className={mb ?? 'mb-12'}>
      <div className="flex items-end justify-between gap-4 mb-5 pb-3.5 border-b border-line">
        <div className="flex items-baseline gap-3.5">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-brand-deep">
            {badge}
          </span>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em]">
            {title}
          </h2>
          {typeof count === 'number' && (
            <span className="font-mono text-[11px] text-ink-soft bg-paper px-2 py-0.5 rounded-sm border border-line">
              {String(count).padStart(2, '0')}{' '}
              {count > 1 ? 'enregistré·es' : 'enregistré·e'}
            </span>
          )}
        </div>
        {action && (
          <Link
            to={action.to}
            className="text-[13px] font-medium text-brand-deep hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function EmptyCard({
  title,
  body,
  cta,
}: {
  title: string
  body: string
  cta?: { label: string; to: string }
}) {
  return (
    <div className="rounded-md border border-line bg-white p-8 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft mb-2">
        {title}
      </p>
      <p className="text-[14px] text-ink-soft mb-5 max-w-[480px] mx-auto leading-relaxed">
        {body}
      </p>
      {cta && (
        <Link
          to={cta.to}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-brand-deep text-paper font-medium text-[13px] transition-colors hover:bg-ink no-underline"
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
          {cta.label}
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// États génériques
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-3 w-32 bg-line rounded-sm" />
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 bg-line rounded-md" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-40 bg-line rounded-sm" />
          <div className="h-10 w-64 bg-line rounded-sm" />
          <div className="h-4 w-72 bg-line rounded-sm" />
        </div>
      </div>
      <div className="h-[180px] bg-white rounded-md border border-line" />
      <div className="h-[210px] bg-brand-tint/70 rounded-lg border border-brand/10" />
      <div className="h-[240px] bg-white rounded-md border border-line" />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="rounded-md border border-status-over/40 bg-status-over-tint/40 p-6 max-w-[640px]">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-status-over mb-2">
        Erreur de chargement
      </p>
      <p className="text-ink mb-4">
        Le dossier de cet animal n'a pas pu être récupéré.
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

function NotFoundState({ id }: { id: string | undefined }) {
  return (
    <div className="max-w-[640px]">
      <BackLink />
      <div className="rounded-md border border-line bg-white p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft mb-2">
          Dossier introuvable
        </p>
        <p className="text-[15px] text-ink mb-2">
          Aucun animal ne correspond à cet identifiant.
        </p>
        {id && (
          <p className="font-mono text-[11px] text-ink-soft mb-6">
            {id}
          </p>
        )}
        <Link to="/animals" className="btn-primary inline-flex">
          Retour au catalogue
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pillClassFor(status: EventStatus): string {
  return status === 'up' ? 'pill-up' : status === 'due' ? 'pill-due' : 'pill-over'
}

function statusLabel(status: EventStatus, nextDue: Date | null): string {
  if (!nextDue) return 'À jour'
  const days = Math.round(
    (nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return formatPillLabel(status, days)
}

function identityLine(animal: Animal): string {
  const parts: string[] = [animal.species_display]
  if (animal.age_in_months != null) parts.push(formatAge(animal.age_in_months))
  if (animal.gender_display) parts.push(animal.gender_display)
  if (animal.department_code) parts.push(`Dpt ${animal.department_code}`)
  return parts.join(' · ')
}

function formatAge(months: number): string {
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'an' : 'ans'}`
}
