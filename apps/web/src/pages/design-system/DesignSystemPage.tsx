/**
 * Espace interne — Charte graphique & Design System.
 *
 * Pour l'instant : sert l'identité visuelle (v1.0) en iframe depuis
 * /public/design-system/identity.html. À terme, accueillera Storybook
 * (probablement via un sous-build et un proxy).
 *
 * Protection : mot de passe partagé d'équipe, défini dans
 * VITE_DESIGN_SYSTEM_PASSWORD. Déverrouillage stocké en sessionStorage
 * (perdu à la fermeture de l'onglet) — c'est volontaire, on ne veut pas
 * que la charte soit accessible indéfiniment depuis un poste partagé.
 */
import { FormEvent, useState } from 'react'
import { BrandMark } from '../../components/brand/BrandMark'

const STORAGE_KEY = 'melampus-ds-unlocked'
const DEFAULT_PASSWORD = 'melampus'
const PASSWORD = import.meta.env.VITE_DESIGN_SYSTEM_PASSWORD ?? DEFAULT_PASSWORD

export function DesignSystemPage() {
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === '1',
  )
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')

  function tryUnlock(e: FormEvent) {
    e.preventDefault()
    if (pwd === PASSWORD) {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
      setUnlocked(true)
      setError('')
    } else {
      setError('Mot de passe invalide.')
    }
  }

  function lock() {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setUnlocked(false)
    setPwd('')
  }

  if (unlocked) {
    return (
      <div className="relative h-screen w-screen bg-paper">
        <iframe
          src="/design-system/identity.html"
          title="Mélampus — Identité visuelle"
          className="w-full h-full border-0 block"
        />
        <button
          onClick={lock}
          type="button"
          className="absolute top-4 right-4 z-10 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft bg-white border border-line rounded-sm px-3 py-1.5 shadow-sm hover:border-ink transition-colors"
        >
          Verrouiller
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6 py-12">
      <form
        onSubmit={tryUnlock}
        className="w-full max-w-sm bg-white border border-line rounded-lg p-8"
      >
        <BrandMark size={40} className="mb-6" />
        <p className="eyebrow mb-2">Espace interne</p>
        <h1 className="text-2xl font-semibold tracking-tightish mb-2">Charte graphique.</h1>
        <p className="text-sm text-ink-soft mb-7 leading-relaxed">
          Cette section est protégée. Saisissez le mot de passe d'équipe pour accéder à l'identité
          visuelle et au design system.
        </p>

        <div className="mb-4">
          <label htmlFor="ds-pwd" className="label">Mot de passe</label>
          <input
            id="ds-pwd"
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            className={`input ${error ? 'is-error' : ''}`}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="text-sm text-status-over mt-1.5">{error}</p>}
        </div>

        <button type="submit" className="btn-primary w-full h-11">
          Déverrouiller
        </button>

        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft mt-6 text-center">
          v1.0 · Storybook à venir
        </p>
      </form>
    </div>
  )
}
