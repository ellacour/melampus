/**
 * Chronologie clinique — frise horizontale 44 jours (−14 / +30).
 *
 * Reproduit le bloc apercu de dashboard.html : carte green-tint, header
 * eyebrow + période, ligne pointillée centrale, marqueur vertical pour
 * « Aujourd'hui », et un t-marker par événement positionné en pourcentage
 * sur l'axe.
 *
 * Quand plusieurs marqueurs collisionnent visuellement, on alterne leur
 * label entre haut/bas — c'est utile sur petits écrans, ou quand deux
 * échéances sont rapprochées.
 */
import { useMemo } from 'react'
import {
  DashboardEvent,
  EventStatus,
  TIMELINE_FUTURE_DAYS,
  TIMELINE_PAST_DAYS,
  TODAY_POSITION_PERCENT,
  formatDayDelta,
  formatDayMonth,
  timelinePosition,
} from './dashboard.lib'

interface ChronologieProps {
  events: DashboardEvent[]
  now: Date
}

interface PositionedEvent {
  event: DashboardEvent
  left: number
  /** Position du label : 'top' au-dessus de la frise, 'bottom' en dessous. */
  labelSide: 'top' | 'bottom'
}

/** Distance minimale (en %) avant qu'on bascule le label suivant en bas. */
const MIN_PERCENT_GAP = 16

export function Chronologie({ events, now }: ChronologieProps) {
  const positioned = useMemo(() => layout(events), [events])

  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - TIMELINE_PAST_DAYS)
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + TIMELINE_FUTURE_DAYS)

  return (
    <section
      aria-label="Chronologie clinique"
      className="relative overflow-hidden rounded-lg border border-brand/15 bg-brand-tint px-10 pt-8 pb-7 mb-14"
    >
      {/* Header */}
      <div className="flex justify-between items-baseline gap-3 pb-3 mb-2 border-b border-brand/10">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep">
          Chronologie clinique
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-ink-soft">
          {formatDayMonth(startDate, true)} → {formatDayMonth(endDate, true)} ·{' '}
          {TIMELINE_PAST_DAYS + TIMELINE_FUTURE_DAYS} jours
        </span>
      </div>

      {/* Timeline */}
      <div className="relative mx-1.5 mt-9 mb-7 h-[92px]">
        {/* Track dashed */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 border-t border-dashed border-brand/30"
        />

        {/* Today vertical line */}
        <div
          aria-hidden
          className="absolute -top-1 -bottom-1 w-px bg-brand-deep"
          style={{ left: `${TODAY_POSITION_PERCENT}%` }}
        />
        <span
          className="absolute -top-[22px] font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-brand-deep whitespace-nowrap bg-white px-2 py-0.5 rounded-sm border border-brand/20 -translate-x-1/2"
          style={{ left: `${TODAY_POSITION_PERCENT}%` }}
        >
          Aujourd'hui · {formatDayMonth(now)}
        </span>

        {/* Markers */}
        {positioned.map(p => (
          <Marker key={p.event.id} positioned={p} />
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Layout : distribue les events sur la frise et alterne haut/bas si trop
// proches. Conserve l'ordre par date.
// ---------------------------------------------------------------------------

function layout(events: DashboardEvent[]): PositionedEvent[] {
  const sorted = [...events].sort((a, b) => a.daysFromToday - b.daysFromToday)
  const result: PositionedEvent[] = []

  for (const event of sorted) {
    const left = timelinePosition(event.daysFromToday)
    const prev = result[result.length - 1]
    // Si le précédent est trop proche et déjà en top, on bascule en bottom.
    const labelSide: 'top' | 'bottom' =
      prev && Math.abs(left - prev.left) < MIN_PERCENT_GAP && prev.labelSide === 'top'
        ? 'bottom'
        : 'top'
    result.push({ event, left, labelSide })
  }
  return result
}

function Marker({ positioned }: { positioned: PositionedEvent }) {
  const { event, left, labelSide } = positioned

  const topLabelClasses =
    'absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap font-mono text-[11px] font-medium tracking-[0.04em]'
  const botLabelClasses =
    'absolute left-1/2 -translate-x-1/2 top-[18px] whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-soft'

  return (
    <div
      className="absolute top-1/2"
      style={{ left: `${left}%` }}
      aria-label={`${event.protocol} — ${event.animalName} — ${formatDayDelta(event.daysFromToday)}`}
    >
      {/* Dot */}
      <span
        className={[
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-3.5 h-3.5 rounded-full border-2 border-white',
          'shadow-[0_0_0_1.5px_rgba(14,91,69,0.20)]',
          dotColor(event.status),
        ].join(' ')}
        aria-hidden
      />

      {/* Top label (protocole) — couleur status si over */}
      {labelSide === 'top' ? (
        <>
          <span
            className={`${topLabelClasses} ${event.status === 'over' ? 'text-status-over' : 'text-ink'}`}
          >
            {event.protocol}
          </span>
          <span className={botLabelClasses}>
            {event.animalName} · {formatDayDelta(event.daysFromToday)}
          </span>
        </>
      ) : (
        <>
          <span className={topLabelClasses + ' text-ink-soft'}>
            {event.animalName}
          </span>
          <span
            className={`${botLabelClasses} ${event.status === 'over' ? 'text-status-over' : ''}`}
          >
            {event.protocol} · {formatDayDelta(event.daysFromToday)}
          </span>
        </>
      )}
    </div>
  )
}

function dotColor(status: EventStatus): string {
  if (status === 'over') return 'bg-status-over'
  if (status === 'due') return 'bg-status-due'
  return 'bg-status-up'
}
