/**
 * État vide : 0 animal suivi. Reproduit dashboard-empty.html en React.
 *
 * Le sidebar gère ses propres compteurs/disabled — ici on s'occupe juste
 * du canvas. Le filigrane EKG est inline en data-URI pour ne pas avoir à
 * ajouter un asset.
 */
import { ReactNode } from 'react'
import type { User } from '@melampus/api-types'

interface EmptyDashboardProps {
  user: User | undefined
  onAddAnimal?: () => void
}

const EKG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><path d='M5 30 L40 30 L52 8 L72 52 L92 8 L112 30 L195 30' stroke='%230E5B45' stroke-width='2.5' fill='none' stroke-linecap='square' stroke-linejoin='miter'/></svg>",
  )

const FEATURES = [
  {
    num: '01 — Calendrier',
    title: 'Vaccinal automatique.',
    body:
      'Règles par espèce, âge et département. Chaque recommandation renvoie à un protocole identifié.',
  },
  {
    num: '02 — Soins',
    title: 'Récurrents structurés.',
    body:
      'Vermifugation, dentaire, maréchalerie. Cycles calculés à partir de la dernière administration.',
  },
  {
    num: '03 — Alertes',
    title: 'Avant échéance.',
    body:
      "Notifications à 30, 7 et 0 jour. Sur le navigateur, par email, et sur l'application mobile.",
  },
] as const

export function EmptyDashboard({ user, onAddAnimal }: EmptyDashboardProps) {
  const hasName = !!user?.first_name

  return (
    <>
      <section
        className="relative overflow-hidden rounded-lg border border-brand/15 bg-brand-tint px-14 py-12 mb-8"
        aria-label="Ajouter un premier animal"
      >
        {/* Filigrane EKG en haut à droite */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-9 right-11 h-[42px] w-[130px] opacity-[.18] bg-no-repeat bg-contain"
          style={{ backgroundImage: `url("${EKG_DATA_URI}")` }}
        />

        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep mb-4">
          Premier animal
        </p>
        <h2 className="text-[30px] font-semibold tracking-tightish leading-[1.15] mb-2.5 max-w-[600px]">
          Ouvrez le dossier de votre premier animal.
        </h2>
        <p className="text-base text-ink-soft leading-relaxed max-w-[540px] mb-8">
          Renseignez l'espèce, l'âge et le département. Mélampus calcule le
          calendrier vaccinal à partir des protocoles vétérinaires français.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
          {FEATURES.map(feat => (
            <div
              key={feat.num}
              className="rounded-md border border-brand/10 bg-white/55 px-[22px] py-5"
            >
              <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep mb-3.5">
                {feat.num}
              </span>
              <h4 className="text-[15px] font-semibold text-ink leading-tight mb-1.5">
                {feat.title}
              </h4>
              <p className="text-[13px] text-ink-soft leading-snug">
                {feat.body}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-[18px] flex-wrap">
          <button
            type="button"
            onClick={onAddAnimal}
            className="inline-flex items-center gap-2.5 h-[46px] px-[22px] rounded-sm bg-brand-deep text-paper font-medium text-sm transition-colors hover:bg-ink"
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
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Ajouter {hasName ? 'mon premier animal' : 'un premier animal'}</span>
          </button>
          <a
            href="#"
            className="text-sm font-medium text-brand-deep hover:underline"
          >
            Importer depuis un carnet existant →
          </a>
        </div>
      </section>

      {/* Trust row */}
      <div className="flex justify-center items-center gap-[18px] pt-6 pb-4 border-t border-line mt-2">
        <TrustItem>Hébergement HDS</TrustItem>
        <TrustDot />
        <TrustItem>Conforme RGPD</TrustItem>
        <TrustDot />
        <TrustItem>Données chiffrées</TrustItem>
      </div>

      <p className="text-center font-mono text-[10px] tracking-[0.08em] uppercase text-ink-soft">
        Mélampus · v1.0 · État initial
      </p>
    </>
  )
}

function TrustItem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">
      {children}
    </span>
  )
}

function TrustDot() {
  return <span className="w-[5px] h-[5px] rounded-full bg-ink-soft opacity-45" />
}
