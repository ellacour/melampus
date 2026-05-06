import { ReactNode } from 'react'
import { BrandMark } from '../brand/BrandMark'

interface Feature {
  num: string
  title: string
  text: string
}

interface BrandPanelProps {
  title: string
  subtitle: string
  features?: Feature[]
}

const DEFAULT_FEATURES: Feature[] = [
  {
    num: '01',
    title: 'Calendrier vaccinal automatique.',
    text: 'Règles par espèce, âge, et département.',
  },
  {
    num: '02',
    title: 'Soins récurrents structurés.',
    text: 'Vermifugation, dentaire, maréchalerie.',
  },
  {
    num: '03',
    title: 'Synchronisation web ↔ mobile.',
    text: 'Une donnée, deux appareils.',
  },
]

/**
 * Panneau marque utilisé par les pages auth (login, register, forgot, etc.).
 * Vert profond, grille discrète en arrière-plan, mentions HDS / RGPD au pied.
 */
export function BrandPanel({ title, subtitle, features = DEFAULT_FEATURES }: BrandPanelProps) {
  return (
    <aside
      className="hidden lg:flex md:flex-1 flex-col justify-between p-14 text-paper relative overflow-hidden"
      style={{
        backgroundColor: '#07382B',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        backgroundPosition: '-1px -1px',
      }}
    >
      <div className="relative z-10">
        <BrandMark size={36} variant="on-deep" withWordmark />
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl font-semibold tracking-tightish max-w-md mb-4 leading-[1.15]">
          {title}
        </h2>
        <p className="text-sm leading-relaxed max-w-md text-paper/70 m-0">{subtitle}</p>

        <ul className="mt-9 pt-7 border-t border-white/10 list-none p-0 space-y-3.5">
          {features.map(f => (
            <li key={f.num} className="grid grid-cols-[28px_1fr] gap-3 text-sm leading-snug text-paper/85">
              <span className="font-mono text-xs text-paper/50 pt-0.5">{f.num}</span>
              <span>
                <strong className="text-paper font-medium">{f.title}</strong>{' '}
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-5 border-t border-white/10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-paper/50">
          <Trust>Hébergement HDS</Trust>
          <Trust>Conforme RGPD</Trust>
          <Trust>Données chiffrées</Trust>
        </div>
      </div>
    </aside>
  )
}

function Trust({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex gap-1.5 items-center">
      <span className="w-1 h-1 rounded-full bg-paper/40" />
      {children}
    </span>
  )
}
