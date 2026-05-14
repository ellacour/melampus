/**
 * Carte animal — vue d'ensemble.
 *
 * Trois zones : header (portrait + identité + pill), body (4 stats mono),
 * footer (suivante + flèche). Cliquable, redirige vers /animals/:id quand
 * la page existera ; pour l'instant <a> sur # pour préserver la
 * sémantique.
 */
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Species } from '@melampus/api-types'
import {
  AnimalSummary,
  formatClinical,
  formatPillLabel,
  portraitFor,
} from './dashboard.lib'

interface AnimalCardProps {
  summary: AnimalSummary
}

export function AnimalCard({ summary }: AnimalCardProps) {
  const { animal, status, nextEvent, lastAdministeredAt, activeProtocols } =
    summary

  const days = nextEvent?.daysFromToday ?? 0
  const pillLabel = formatPillLabel(status, days)

  const parts: string[] = [animal.species_display]
  if (animal.age_in_months != null) parts.push(formatAge(animal.age_in_months))
  if (animal.breed) parts.push(animal.breed)
  const speciesLine = parts.join(' · ')

  return (
    <Link
      to={`/animals/${animal.id}`}
      className="block overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-line-strong hover:shadow-md group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-[22px] pt-5 pb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Portrait species={animal.species} />
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-[-0.015em] text-ink leading-tight">
              {animal.name}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
              {speciesLine}
            </div>
          </div>
        </div>
        <Pill status={status}>{pillLabel}</Pill>
      </div>

      {/* Body grid 2×2 */}
      <div className="border-t border-line px-[22px] py-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
        <Stat label="Dernière administration">
          {lastAdministeredAt ? formatClinical(lastAdministeredAt) : '—'}
        </Stat>
        <Stat label={status === 'over' ? 'Échéance dépassée' : 'Prochaine échéance'}>
          {nextEvent ? formatClinical(nextEvent.dueAt) : '—'}
        </Stat>
        <Stat label="Protocoles actifs">
          {String(activeProtocols).padStart(2, '0')}
        </Stat>
        <Stat label="Département" muted>
          {animal.department_code || '—'}
        </Stat>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-[22px] py-3 bg-paper border-t border-line">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">
          {nextEvent ? (
            <>
              {status === 'over' ? 'À traiter' : 'Suivant'}{' '}
              <strong className="font-medium text-ink">· {nextEvent.protocol}</strong>
            </>
          ) : (
            'Aucune action requise'
          )}
        </div>
        <svg
          className="text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-brand-deep"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Petites bricks privées
// ---------------------------------------------------------------------------

function Stat({
  label,
  children,
  muted,
}: {
  label: string
  children: ReactNode
  muted?: boolean
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-1">
        {label}
      </div>
      <div
        className={`font-mono text-[13px] ${muted ? 'text-ink-soft' : 'text-ink'}`}
      >
        {children}
      </div>
    </div>
  )
}

function Pill({
  status,
  children,
}: {
  status: 'up' | 'due' | 'over'
  children: ReactNode
}) {
  // .pill-up/due/over sont définis dans index.css — on s'appuie dessus pour
  // garder une source unique des couleurs cliniques.
  const className =
    status === 'up' ? 'pill-up' : status === 'due' ? 'pill-due' : 'pill-over'
  return <span className={`${className} whitespace-nowrap`}>{children}</span>
}

function Portrait({
  species,
  size = 'md',
}: {
  species: Species
  /** sm = 36px / md = 44px (défaut) / lg = 80px — utilisé sur la fiche détail */
  size?: 'sm' | 'md' | 'lg'
}) {
  const kind = portraitFor(species)
  const dims =
    size === 'lg'
      ? { box: 'w-20 h-20 rounded-md', svg: 40, stroke: 1.4 }
      : size === 'sm'
        ? { box: 'w-9 h-9 rounded-sm', svg: 18, stroke: 1.6 }
        : { box: 'w-11 h-11 rounded-sm', svg: 22, stroke: 1.6 }
  return (
    <div
      className={`${dims.box} border border-line bg-paper inline-flex items-center justify-center flex-shrink-0`}
    >
      <svg
        width={dims.svg}
        height={dims.svg}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={dims.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-deep"
        aria-hidden
      >
        {kind === 'equine' && (
          <>
            <path d="M5 16c0-3 2-5 5-5h2c2 0 4 2 4 4v0a3 3 0 0 1-3 3H8" />
            <path d="M19 7l-2 2-2-2-1 2 2 4" />
            <path d="M14 13l-1 5" />
            <path d="M10 18v3" />
            <path d="M5 16l-2 2" />
          </>
        )}
        {kind === 'canine' && (
          <>
            <path d="M10 5l-2 4 4 1 4-1-2-4" />
            <path d="M5 10c-1 1-2 3-2 5 0 3 2 5 5 5h8c3 0 5-2 5-5 0-2-1-4-2-5" />
            <circle cx="9" cy="14" r=".7" fill="currentColor" />
            <circle cx="15" cy="14" r=".7" fill="currentColor" />
            <path d="M11 17h2" />
          </>
        )}
        {kind === 'feline' && (
          <>
            <path d="M5 4l3 5" />
            <path d="M19 4l-3 5" />
            <path d="M5 9c-1 1-1.5 3-1.5 5 0 3 2.5 6 8.5 6s8.5-3 8.5-6c0-2-.5-4-1.5-5" />
            <circle cx="9.5" cy="13" r=".7" fill="currentColor" />
            <circle cx="14.5" cy="13" r=".7" fill="currentColor" />
            <path d="M11 16h2" />
          </>
        )}
        {kind === 'generic' && (
          <>
            <circle cx="12" cy="10" r="6" />
            <path d="M6 20c0-3 3-5 6-5s6 2 6 5" />
          </>
        )}
      </svg>
    </div>
  )
}

function formatAge(months: number): string {
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'an' : 'ans'}`
}

export { Portrait as AnimalPortrait }
