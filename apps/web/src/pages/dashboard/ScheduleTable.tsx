/**
 * Tableau Échéances à venir.
 *
 * Six colonnes desktop (marker · protocole+rule_id · animal+espèce · pill ·
 * date+jours · flèche). On gère le responsive comme la maquette :
 *  - 900px : on retire la flèche et la pill
 *  - 600px : on retire animal et date (la pill garde l'info essentielle)
 */
import { ReactNode } from 'react'
import type { Species } from '@melampus/api-types'
import {
  DashboardEvent,
  EventStatus,
  formatClinical,
  formatDayDelta,
  formatPillLabel,
} from './dashboard.lib'

interface ScheduleTableProps {
  events: DashboardEvent[]
  windowDays?: number
  onOpenEvent?: (event: DashboardEvent) => void
}

export function ScheduleTable({
  events,
  windowDays = 30,
  onOpenEvent,
}: ScheduleTableProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white p-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
          Aucune échéance dans la fenêtre.
        </p>
        <p className="text-sm text-ink-soft mt-2">
          Vos protocoles sont à jour pour les {windowDays} prochains jours.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-line bg-white overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[36px_1.6fr_1.4fr_1fr_140px_60px] items-center px-[22px] py-3.5 bg-paper border-b border-line font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft">
        <span />
        <span>Protocole</span>
        <span>Animal</span>
        <span>Statut</span>
        <span>Échéance</span>
        <span />
      </div>

      {events.map(event => (
        <ScheduleRow
          key={event.id}
          event={event}
          onOpen={() => onOpenEvent?.(event)}
        />
      ))}

      <div className="flex justify-between items-center gap-3 px-[22px] py-3.5 bg-paper border-t border-line">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
          Fenêtre · {windowDays} jours · {String(events.length).padStart(2, '0')} protocole{events.length > 1 ? 's' : ''}
        </span>
        <a
          href="#"
          className="text-sm font-medium text-brand-deep hover:underline"
        >
          Ouvrir le calendrier complet
        </a>
      </div>
    </div>
  )
}

function ScheduleRow({
  event,
  onOpen,
}: {
  event: DashboardEvent
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full grid grid-cols-[36px_1fr_110px] md:grid-cols-[36px_1.6fr_1.4fr_1fr_140px_60px] items-center px-[22px] py-4 border-b border-line last:border-b-0 hover:bg-paper transition-colors text-left group"
    >
      <Marker status={event.status} />

      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{event.protocol}</div>
        {event.ruleId && (
          <div className="mt-0.5 font-mono text-[10px] tracking-[0.04em] text-ink-soft">
            {event.ruleId}
          </div>
        )}
      </div>

      <div className="hidden md:block min-w-0">
        <div className="text-sm text-ink">{event.animalName}</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
          {speciesShortLabel(event.species)} · {event.breed || '—'}
        </div>
      </div>

      <div className="hidden md:flex">
        <Pill status={event.status}>
          {formatPillLabel(event.status, event.daysFromToday)}
        </Pill>
      </div>

      <div className="font-mono text-[12.5px] text-ink whitespace-nowrap md:text-[13px] text-right md:text-left">
        {formatClinical(event.dueAt)}
        <span
          className={`block mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.04em] ${
            event.status === 'over'
              ? 'text-status-over'
              : event.status === 'due'
                ? 'text-status-due'
                : 'text-ink-soft'
          }`}
        >
          {formatDayDelta(event.daysFromToday)}
        </span>
      </div>

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
    </button>
  )
}

function Marker({ status }: { status: EventStatus }) {
  const color =
    status === 'over'
      ? 'bg-status-over'
      : status === 'due'
        ? 'bg-status-due'
        : 'bg-ink-soft'
  return <span className={`block w-2 h-2 rounded-full ${color}`} aria-hidden />
}

function Pill({
  status,
  children,
}: {
  status: EventStatus
  children: ReactNode
}) {
  const className =
    status === 'up' ? 'pill-up' : status === 'due' ? 'pill-due' : 'pill-over'
  return <span className={`${className} whitespace-nowrap`}>{children}</span>
}

function speciesShortLabel(species: Species): string {
  // Le species_display backend est correct ; ce helper sert juste de
  // capitalisation FR cohérente quand on n'a que le code.
  switch (species) {
    case 'equine':
      return 'Équin'
    case 'canine':
      return 'Canin'
    case 'feline':
      return 'Félin'
    case 'bovine':
      return 'Bovin'
    case 'ovine':
      return 'Ovin'
    case 'caprine':
      return 'Caprin'
    case 'porcine':
      return 'Porcin'
    case 'avian':
      return 'Aviaire'
    default:
      return 'Autre'
  }
}
