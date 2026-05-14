/**
 * Dashboard data composition.
 *
 * Backend renvoie déjà next_due_at et status par record. On compose ici la
 * vue produit :
 *  - une chronologie sur fenêtre fixe −14 j / +30 j (cf. maquette)
 *  - une liste d'échéances (overdue + due_soon) triée par date
 *  - un statut par animal (worst-of de ses protocoles)
 *
 * Note : la maquette utilise des labels FR pour les espèces et un cycle de
 * cards 2×2 (4 stats : dernière admin, prochaine, protocoles actifs,
 * département). Quand l'API n'expose pas directement « protocoles actifs »
 * on dérive du nombre de records non « not_applicable ».
 */
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  Animal,
  Species,
  VaccinationRecord,
  RecurringCare,
} from '@melampus/api-types'

export type EventStatus = 'up' | 'due' | 'over'

export interface DashboardEvent {
  id: string
  type: 'vaccination' | 'care'
  protocol: string
  ruleId: string | null
  animalId: string
  animalName: string
  species: Species
  speciesDisplay: string
  breed: string
  dueAt: Date
  daysFromToday: number
  status: EventStatus
}

/** Fenêtre chronologie (jours). Symétrique à la maquette : −14 → +30. */
export const TIMELINE_PAST_DAYS = 14
export const TIMELINE_FUTURE_DAYS = 30
export const TIMELINE_TOTAL_DAYS = TIMELINE_PAST_DAYS + TIMELINE_FUTURE_DAYS

export const SCHEDULE_FUTURE_DAYS = 30

// ---------------------------------------------------------------------------
// Mapping records → events
// ---------------------------------------------------------------------------

function statusFromVaccination(
  raw: VaccinationRecord['status'],
): EventStatus | null {
  if (raw === 'overdue') return 'over'
  if (raw === 'due_soon') return 'due'
  if (raw === 'up_to_date') return 'up'
  return null
}

function statusFromCare(raw: RecurringCare['status']): EventStatus | null {
  if (raw === 'overdue') return 'over'
  if (raw === 'pending') return 'due'
  if (raw === 'done') return 'up'
  return null
}

export function vaccinationToEvent(
  record: VaccinationRecord,
  animal: Animal,
  now: Date,
): DashboardEvent | null {
  if (!record.next_due_at) return null
  const status = statusFromVaccination(record.status)
  if (!status) return null
  const dueAt = parseISO(record.next_due_at)
  return {
    id: `vac-${record.id}`,
    type: 'vaccination',
    protocol: record.vaccine_name,
    ruleId: record.rule != null ? `VAC.${record.rule}` : null,
    animalId: animal.id,
    animalName: animal.name,
    species: animal.species,
    speciesDisplay: animal.species_display,
    breed: animal.breed,
    dueAt,
    daysFromToday: differenceInCalendarDays(dueAt, now),
    status,
  }
}

export function careToEvent(
  care: RecurringCare,
  animal: Animal,
  now: Date,
): DashboardEvent | null {
  if (!care.next_due_at) return null
  const status = statusFromCare(care.status)
  if (!status) return null
  const dueAt = parseISO(care.next_due_at)
  return {
    id: `care-${care.id}`,
    type: 'care',
    protocol: care.name,
    ruleId: null,
    animalId: animal.id,
    animalName: animal.name,
    species: animal.species,
    speciesDisplay: animal.species_display,
    breed: animal.breed,
    dueAt,
    daysFromToday: differenceInCalendarDays(dueAt, now),
    status,
  }
}

export function buildAllEvents(
  animals: Animal[],
  vaccinations: VaccinationRecord[],
  care: RecurringCare[],
  now: Date,
): DashboardEvent[] {
  const animalById = new Map(animals.map(a => [a.id, a]))
  const events: DashboardEvent[] = []

  for (const record of vaccinations) {
    const animal = animalById.get(record.animal)
    if (!animal) continue
    const event = vaccinationToEvent(record, animal, now)
    if (event) events.push(event)
  }
  for (const recurring of care) {
    const animal = animalById.get(recurring.animal)
    if (!animal) continue
    const event = careToEvent(recurring, animal, now)
    if (event) events.push(event)
  }
  return events
}

// ---------------------------------------------------------------------------
// Chronologie & Schedule selectors
// ---------------------------------------------------------------------------

/** Events dans la fenêtre chronologie : statut over OU due dans −14/+30. */
export function selectTimelineEvents(
  events: DashboardEvent[],
): DashboardEvent[] {
  return events
    .filter(e => e.status !== 'up')
    .filter(
      e =>
        e.daysFromToday >= -TIMELINE_PAST_DAYS &&
        e.daysFromToday <= TIMELINE_FUTURE_DAYS,
    )
    .sort((a, b) => a.daysFromToday - b.daysFromToday)
}

/** Position en % sur la frise (0 = bord gauche, 100 = bord droit). */
export function timelinePosition(daysFromToday: number): number {
  const x = (daysFromToday + TIMELINE_PAST_DAYS) / TIMELINE_TOTAL_DAYS
  return Math.max(0, Math.min(100, x * 100))
}

export const TODAY_POSITION_PERCENT =
  (TIMELINE_PAST_DAYS / TIMELINE_TOTAL_DAYS) * 100

/** Échéances tableau : tous les over + due dans +30 j, triés par date. */
export function selectScheduleEvents(
  events: DashboardEvent[],
): DashboardEvent[] {
  return events
    .filter(e => e.status === 'over' || e.status === 'due')
    .filter(e => e.daysFromToday <= SCHEDULE_FUTURE_DAYS)
    .sort((a, b) => a.daysFromToday - b.daysFromToday)
}

// ---------------------------------------------------------------------------
// Per-animal aggregation
// ---------------------------------------------------------------------------

const STATUS_RANK: Record<EventStatus, number> = { up: 0, due: 1, over: 2 }

export function worstStatus(events: DashboardEvent[]): EventStatus {
  let worst: EventStatus = 'up'
  for (const e of events) {
    if (STATUS_RANK[e.status] > STATUS_RANK[worst]) worst = e.status
  }
  return worst
}

export interface AnimalSummary {
  animal: Animal
  status: EventStatus
  nextEvent: DashboardEvent | null
  lastAdministeredAt: Date | null
  activeProtocols: number
}

export function summarizeAnimal(
  animal: Animal,
  vaccinations: VaccinationRecord[],
  care: RecurringCare[],
  now: Date,
): AnimalSummary {
  const animalVacs = vaccinations.filter(v => v.animal === animal.id)
  const animalCare = care.filter(c => c.animal === animal.id)

  const events = buildAllEvents([animal], animalVacs, animalCare, now)

  // worst-of pour le statut global (over > due > up)
  const status = worstStatus(events)

  // prochaine action : due ou over le plus proche (over compté comme priorité
  // donc plus négatif gagne quand statut = over, sinon plus petit positif).
  const candidates = events.filter(e => e.status !== 'up')
  candidates.sort((a, b) => {
    if (a.status === 'over' && b.status !== 'over') return -1
    if (b.status === 'over' && a.status !== 'over') return 1
    return a.daysFromToday - b.daysFromToday
  })
  const nextEvent = candidates[0] ?? null

  // dernière administration : record vaccinal le plus récent
  const lastAdministeredAt = animalVacs
    .map(v => parseISO(v.administered_at))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  // protocoles actifs : non « not_applicable » + cares actifs
  const activeVacs = animalVacs.filter(v => v.status !== 'not_applicable').length
  const activeCare = animalCare.filter(c => c.is_active).length

  return {
    animal,
    status,
    nextEvent,
    lastAdministeredAt,
    activeProtocols: activeVacs + activeCare,
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const MONTH_LABEL_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const MONTH_LABEL_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Format clinique DD / MM / YYYY (slashed mono, cf. charte). */
export function formatClinical(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d} / ${m} / ${y}`
}

/** « 14 mai » — pour les marqueurs frise. Jour padé pour rester aligné. */
export function formatDayMonth(date: Date, long = false): string {
  const day = String(date.getDate()).padStart(2, '0')
  const labels = long ? MONTH_LABEL_LONG : MONTH_LABEL_SHORT
  // getMonth() ∈ [0,11], les tableaux ont 12 entrées — fallback défensif vide
  // pour satisfaire noUncheckedIndexedAccess.
  const month = labels[date.getMonth()] ?? ''
  return `${day} ${month}`
}

const WEEKDAY = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/** « Dimanche 10 mai 2026 » — page head. */
export function formatLongDate(date: Date): string {
  const day = WEEKDAY[date.getDay()] ?? ''
  const month = MONTH_LABEL_LONG[date.getMonth()] ?? ''
  return `${day} ${date.getDate()} ${month} ${date.getFullYear()}`
}

/** « + 4 j » / « − 12 j » — quantités jours signées, mono. */
export function formatDayDelta(days: number): string {
  if (days === 0) return "Aujourd'hui"
  const sign = days > 0 ? '+' : '−'
  return `${sign} ${Math.abs(days)} j`
}

/** Pill text — « En retard 12 j » / « Dû dans 4 j » / « À jour ». */
export function formatPillLabel(status: EventStatus, days: number): string {
  if (status === 'up') return 'À jour'
  if (status === 'over') return `En retard ${Math.abs(days)} j`
  if (days === 0) return "Dû aujourd'hui"
  return `Dû dans ${days} j`
}

// ---------------------------------------------------------------------------
// Species portraits — used by AnimalCard.tsx
// ---------------------------------------------------------------------------

/** Sous-groupe de Species avec une silhouette dessinée. Les autres tombent
 * sur l'icône generic. */
export type PortraitKind = 'equine' | 'canine' | 'feline' | 'generic'

export function portraitFor(species: Species): PortraitKind {
  if (species === 'equine') return 'equine'
  if (species === 'canine') return 'canine'
  if (species === 'feline') return 'feline'
  return 'generic'
}
