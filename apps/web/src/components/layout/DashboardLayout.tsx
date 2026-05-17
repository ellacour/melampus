/**
 * Layout principal de l'app authentifiée.
 *
 * Sidebar gauche (248px), main canvas droite scrollable. Aligné sur la
 * charte v1.0 :
 *  - Mark + wordmark en haut, tag « Carnet de santé · v1.0 »
 *  - Nav sections (Espace / Compte) avec eyebrow mono
 *  - Items : SVG feather (plus d'emojis), pill compteur facultatif
 *  - Footer : user-card (avatar initiales · nom · email) + signout
 *
 * Note : les compteurs (00) du sidebar ne sont pas branchés ici — c'est
 * volontaire, le sidebar reste un layout, pas un consommateur de queries.
 * Si on veut afficher de vrais comptes plus tard, on pourra ajouter un
 * useDashboard léger ou pousser via context.
 */
import { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { User } from '@melampus/api-types'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { BrandMark } from '../brand/BrandMark'
import {
  OverviewIcon,
  AnimalsIcon,
  VaccinationsIcon,
  CareIcon,
  AlertsIcon,
  ExportIcon,
  SettingsIcon,
  PlusIcon,
} from '../icons/Icons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV_PRIMARY: NavItem[] = [
  {
    to: '/',
    label: "Vue d'ensemble",
    icon: <OverviewIcon />,
  },
  {
    to: '/animals',
    label: 'Mes animaux',
    icon: <AnimalsIcon />,
  },
  {
    to: '/vaccinations',
    label: 'Vaccinations',
    icon: <VaccinationsIcon />,
  },
  {
    to: '/care',
    label: 'Soins récurrents',
    icon: <CareIcon />,
  },
  {
    to: '/notifications',
    label: 'Alertes',
    icon: <AlertsIcon />,
  },
]

const NAV_ACCOUNT: NavItem[] = [
  {
    to: '/export',
    label: 'Export PDF',
    icon: <ExportIcon />,
  },
  {
    to: '/settings',
    label: 'Paramètres',
    icon: <SettingsIcon />,
  },
]

export function DashboardLayout() {
  const clearTokens = useAuthStore(s => s.clearTokens)

  // /auth/me/ est déjà queried par useDashboard ; en partageant la clé,
  // TanStack Query évite un round-trip réseau supplémentaire ici.
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<User>('/auth/me/')
      return data
    },
  })

  return (
    <div className="grid grid-cols-[248px_1fr] min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen bg-white border-r border-line flex flex-col">
        <div className="px-6 pt-6 pb-[22px] border-b border-line">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <BrandMark size={28} />
            <span className="font-sans font-semibold text-[20px] tracking-tightish text-ink leading-none">
              mélampus
            </span>
          </Link>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
            Carnet de santé · v1.0
          </p>
        </div>

        <nav className="flex-1 px-3.5 py-5 flex flex-col gap-0.5">
          <SectionLabel>Espace</SectionLabel>
          {NAV_PRIMARY.map(item => (
            <NavRow key={item.to} {...item} />
          ))}

          <SectionLabel className="mt-4">Compte</SectionLabel>
          {NAV_ACCOUNT.map(item => (
            <NavRow key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-3.5 border-t border-line">
          <UserCard user={meQuery.data} />
          <button
            type="button"
            onClick={clearTokens}
            className="mt-1.5 w-full text-left bg-transparent border-0 px-2.5 py-2 font-sans text-xs text-ink-soft rounded-sm transition-colors hover:text-status-over hover:bg-paper cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 overflow-x-hidden">
        <TopBar />
        <div className="px-14 pt-10 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top bar — crumbs + CTA primaire « + Ajouter un animal »
// ---------------------------------------------------------------------------

const CRUMB_LABELS: Array<{ match: (p: string) => boolean; label: string }> = [
  { match: p => p === '/', label: "Vue d'ensemble" },
  { match: p => p === '/animals/new', label: 'Mes animaux / Nouveau' },
  { match: p => p.startsWith('/animals'), label: 'Mes animaux' },
  { match: p => p.startsWith('/vaccinations'), label: 'Vaccinations' },
  { match: p => p.startsWith('/care'), label: 'Soins récurrents' },
  { match: p => p.startsWith('/notifications'), label: 'Alertes' },
  { match: p => p.startsWith('/settings'), label: 'Paramètres' },
  { match: p => p.startsWith('/export'), label: 'Export PDF' },
]

function TopBar() {
  const location = useLocation()
  const crumb =
    CRUMB_LABELS.find(c => c.match(location.pathname))?.label ?? 'Espace'

  // On masque la CTA primaire sur l'écran de création — déjà là, pas de
  // sens de la pousser à nouveau.
  const showAddCta = location.pathname !== '/animals/new'

  return (
    <div className="flex items-center justify-between px-14 py-[22px] border-b border-line">
      <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
        <span>Espace</span>
        <span className="text-line-strong">/</span>
        <strong className="font-medium text-ink">{crumb}</strong>
      </div>
      {showAddCta && (
        <Link
          to="/animals/new"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-sm bg-brand-deep text-paper font-medium text-[13px] leading-none transition-colors hover:bg-ink no-underline"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <PlusIcon />
          </svg>
          Ajouter un animal
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-blocs
// ---------------------------------------------------------------------------

function SectionLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`px-2.5 pt-3.5 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-soft ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

function NavRow({ to, label, icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center justify-between px-2.5 py-2 rounded-sm text-sm transition-colors no-underline',
          isActive
            ? 'bg-brand-tint text-brand-deep font-medium'
            : 'text-ink-soft hover:bg-paper hover:text-ink',
        ].join(' ')
      }
    >
      <span className="inline-flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          {icon}
        </svg>
        {label}
      </span>
    </NavLink>
  )
}

function UserCard({ user }: { user: User | undefined }) {
  const initials = user ? initialsFromName(user.first_name, user.last_name) : '··'
  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : 'Chargement…'
  const email = user?.email ?? ''

  return (
    <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-sm transition-colors hover:bg-paper cursor-pointer">
      <span className="w-8 h-8 rounded-full bg-brand-deep text-paper inline-flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {initials}
      </span>
      <div className="leading-tight min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">
          {displayName}
        </div>
        <div className="font-mono text-[10px] text-ink-soft truncate">
          {email}
        </div>
      </div>
    </div>
  )
}

function initialsFromName(first: string, last: string): string {
  const a = first?.[0] ?? ''
  const b = last?.[0] ?? ''
  const combined = `${a}${b}`.toUpperCase()
  return combined || '··'
}
