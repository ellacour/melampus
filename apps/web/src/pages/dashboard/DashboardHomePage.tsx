/**
 * Page d'accueil — route /.
 *
 * Trois états :
 *  - chargement initial : squelette discret
 *  - aucun animal : EmptyDashboard
 *  - sinon : page-head + Chronologie + Échéances → Mes animaux
 *
 * La date « now » est figée pour le rendu (mémoïsée) afin que la frise
 * ne se décale pas entre deux re-renders quand l'utilisateur ne fait rien.
 */
import { ReactNode, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimalCard } from './AnimalCard'
import { Chronologie } from './Chronologie'
import { EmptyDashboard } from './EmptyDashboard'
import { ScheduleTable } from './ScheduleTable'
import {
  buildAllEvents,
  formatLongDate,
  selectScheduleEvents,
  selectTimelineEvents,
  summarizeAnimal,
} from './dashboard.lib'
import { useDashboard } from './useDashboard'

export function DashboardHomePage() {
  const navigate = useNavigate()
  const { isLoading, error, user, animals, vaccinations, care } = useDashboard()

  // Fige la date à l'entrée pour ne pas recomposer la frise en cours de
  // rendu. En prod, peut être rafraîchi sur changement de jour si besoin.
  const now = useMemo(() => new Date(), [])

  if (isLoading) return <DashboardSkeleton />
  if (error) return <DashboardError onRetry={() => window.location.reload()} />
  if (animals.length === 0) {
    return (
      <>
        <DashboardHeader user={user} animalsCount={0} now={now} variant="empty" />
        <EmptyDashboard
          user={user}
          onAddAnimal={() => navigate('/animals/new')}
        />
      </>
    )
  }

  const allEvents = buildAllEvents(animals, vaccinations, care, now)
  const timelineEvents = selectTimelineEvents(allEvents)
  const scheduleEvents = selectScheduleEvents(allEvents)
  const summaries = animals.map(a => summarizeAnimal(a, vaccinations, care, now))

  return (
    <>
      <DashboardHeader
        user={user}
        animalsCount={animals.length}
        now={now}
        variant="data"
      />

      <Chronologie events={timelineEvents} now={now} />

      <Section
        title="Échéances à venir"
        badge={`${String(scheduleEvents.length).padStart(2, '0')} protocole${scheduleEvents.length > 1 ? 's' : ''} · 30 j`}
        link={{ to: '/calendar', label: 'Tout le calendrier →' }}
      >
        <ScheduleTable events={scheduleEvents} />
      </Section>

      <Section
        title="Mes animaux"
        badge={`${String(animals.length).padStart(2, '0')} dossier${animals.length > 1 ? 's' : ''}`}
        link={{ to: '/animals', label: 'Voir tous les animaux →' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {summaries.map(summary => (
            <AnimalCard key={summary.animal.id} summary={summary} />
          ))}
        </div>
      </Section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sous-blocs : header, section, skeleton, erreur
// ---------------------------------------------------------------------------

function DashboardHeader({
  user,
  animalsCount,
  now,
  variant,
}: {
  user: { first_name: string } | undefined
  animalsCount: number
  now: Date
  variant: 'data' | 'empty'
}) {
  const firstName = user?.first_name ?? ''

  const greeting =
    variant === 'empty'
      ? `Bienvenue${firstName ? `, ${firstName}` : ''}.`
      : `Bonjour${firstName ? ` ${firstName}` : ''}.`

  const eyebrow =
    variant === 'empty'
      ? 'Premier pas · 0 animal suivi'
      : `Vue d'ensemble · ${animalsCount} animal${animalsCount > 1 ? 'aux' : ''} suivi${animalsCount > 1 ? 's' : ''}`

  const lede =
    variant === 'empty'
      ? "Votre carnet est prêt. Il ne contient encore aucun animal — ajoutez-en un pour démarrer le suivi vaccinal automatique."
      : "Voici l'essentiel pour cette semaine. Vous pouvez tout exporter en PDF si votre vétérinaire le demande."

  const timestampLine = variant === 'empty' ? 'Compte créé · à l\'instant' : 'Dernière synchro · à l\'instant'

  return (
    <header className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-8 mb-10">
      <div>
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-3">
          {eyebrow}
        </span>
        <h1 className="text-[36px] font-semibold tracking-[-0.025em] leading-[1.1] mb-1.5">
          {greeting}
        </h1>
        <p className="text-[15px] text-ink-soft max-w-[580px]">{lede}</p>
      </div>
      <div className="text-left sm:text-right font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft leading-relaxed">
        <strong className="block text-[13px] font-medium text-ink mb-0.5 normal-case tracking-normal">
          {formatLongDate(now)}
        </strong>
        {timestampLine}
      </div>
    </header>
  )
}

function Section({
  title,
  badge,
  link,
  children,
}: {
  title: string
  badge?: string
  link?: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between gap-3 pb-3.5 mb-5 border-b border-line">
        <div className="flex items-baseline gap-3.5">
          <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{title}</h2>
          {badge && (
            <span className="font-mono text-[11px] text-ink-soft bg-paper px-2 py-0.5 rounded-sm border border-line">
              {badge}
            </span>
          )}
        </div>
        {link && (
          <Link
            to={link.to}
            className="text-sm font-medium text-brand-deep hover:underline"
          >
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-3 w-40 bg-line rounded-sm mb-3" />
        <div className="h-9 w-60 bg-line rounded-sm mb-2" />
        <div className="h-4 w-96 bg-line rounded-sm" />
      </div>
      <div className="h-[210px] bg-brand-tint/70 rounded-lg border border-brand/10" />
      <div className="h-[260px] bg-white rounded-md border border-line" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[210px] bg-white rounded-md border border-line" />
        <div className="h-[210px] bg-white rounded-md border border-line" />
      </div>
    </div>
  )
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-md border border-status-over/40 bg-status-over-tint/50 p-8 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-status-over mb-2">
        Erreur de chargement
      </p>
      <p className="text-ink mb-5">
        Les données du dashboard n'ont pas pu être récupérées.
      </p>
      <button type="button" onClick={onRetry} className="btn-secondary">
        Réessayer
      </button>
    </div>
  )
}
