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
import { AnimalPortrait } from '../../components/icons/Icons'
import {
  AnimalSummary,
  formatClinical,
  formatPillLabel,
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
          <AnimalPortrait species={animal.species} />
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

function formatAge(months: number): string {
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'an' : 'ans'}`
}

// AnimalPortrait est réexporté depuis Icons.tsx — les imports existants dans
// AnimalsPage et AnimalDetailPage continuent de fonctionner via ce re-export.
export { AnimalPortrait } from '../../components/icons/Icons'
