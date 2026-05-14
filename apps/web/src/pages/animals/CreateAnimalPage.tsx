/**
 * Création d'un dossier animal.
 *
 * Form structuré en 4 sections numérotées (Identité, Naissance,
 * Localisation, Notes) qui font écho au pattern des features `01/02/03`
 * du brand-panel et du dashboard-empty.
 *
 * Validation : zod côté front pour le feedback immédiat, le backend reste
 * autorité finale sur la sémantique (codes département valides, etc.).
 *
 * À la création réussie : invalidation de `['animals']` (le dashboard et la
 * liste se rafraîchissent automatiquement), puis redirection vers le
 * dossier de l'animal. Si la fiche détaillée n'existe pas encore, on
 * retombe sur `/` via le fallback du routeur.
 */
import { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import type { Animal, Gender, Species } from '@melampus/api-types'
import { apiClient } from '../../api/client'

// ---------------------------------------------------------------------------
// Options & schema
// ---------------------------------------------------------------------------

const SPECIES_OPTIONS: ReadonlyArray<{ value: Species; label: string }> = [
  { value: 'canine', label: 'Canin · chien' },
  { value: 'feline', label: 'Félin · chat' },
  { value: 'equine', label: 'Équin · cheval, âne, poney' },
  { value: 'bovine', label: 'Bovin · vache, taureau' },
  { value: 'ovine', label: 'Ovin · mouton, brebis' },
  { value: 'caprine', label: 'Caprin · chèvre, bouc' },
  { value: 'porcine', label: 'Porcin · cochon' },
  { value: 'avian', label: 'Aviaire · oiseau, volaille' },
  { value: 'other', label: 'Autre' },
]

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Mâle' },
  { value: 'female', label: 'Femelle' },
  { value: 'unknown', label: 'Inconnu' },
]

const animalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(80, '80 caractères maximum.'),
  species: z.enum([
    'canine',
    'feline',
    'equine',
    'bovine',
    'ovine',
    'caprine',
    'porcine',
    'avian',
    'other',
  ]),
  gender: z.enum(['male', 'female', 'unknown']),
  breed: z.string().trim().max(80, '80 caractères maximum.').optional(),
  birth_date: z
    .string()
    .optional()
    .refine(
      v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      'Date invalide (AAAA-MM-JJ).',
    ),
  identification_number: z
    .string()
    .trim()
    .max(60, '60 caractères maximum.')
    .optional(),
  department_code: z
    .string()
    .trim()
    .regex(/^(\d{2,3}|2A|2B)$/i, 'Code département FR (2 chiffres ou 2A/2B).')
    .transform(v => v.toUpperCase()),
  notes: z.string().trim().max(2000, '2000 caractères maximum.').optional(),
})

type AnimalForm = z.infer<typeof animalSchema>

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CreateAnimalPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      gender: 'unknown',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: AnimalForm) => {
      // On normalise les champs optionnels vides en chaîne vide / null
      // selon ce que le backend attend (cf. Animal type).
      const payload = {
        name: data.name,
        species: data.species,
        gender: data.gender,
        breed: data.breed ?? '',
        birth_date: data.birth_date || null,
        identification_number: data.identification_number ?? '',
        photo: null,
        notes: data.notes ?? '',
        department_code: data.department_code,
      }
      const response = await apiClient.post<Animal>('/animals/', payload)
      return response.data
    },
    onSuccess: () => {
      // Invalidations larges — la chronologie du dashboard et la liste
      // reflèteront immédiatement le nouvel enregistrement.
      void queryClient.invalidateQueries({ queryKey: ['animals'] })
      void queryClient.invalidateQueries({ queryKey: ['vaccinations'] })
      void queryClient.invalidateQueries({ queryKey: ['care'] })
      // Retour à la vue d'ensemble — la fiche /animals/:id viendra plus
      // tard, on ne navigue pas sur un placeholder.
      navigate('/')
    },
    onError: () => {
      setError('root', {
        message:
          "Impossible de créer le dossier. Vérifiez les champs ou réessayez.",
      })
    },
  })

  return (
    <div className="max-w-[760px]">
      {/* Page head */}
      <header className="mb-10">
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-3">
          Ajout d'un dossier
        </span>
        <h1 className="text-[36px] font-semibold tracking-[-0.025em] leading-[1.1] mb-2">
          Nouvel animal.
        </h1>
        <p className="text-[15px] text-ink-soft max-w-[580px]">
          Renseignez les informations de base. Vous pourrez ajouter
          vaccinations et soins juste après.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        noValidate
        className="space-y-10"
      >
        {/* 01 — Identité */}
        <FormSection num="01" title="Identité" subtitle="Comment vous appelez l'animal, et de quelle espèce il s'agit.">
          <Field
            label="Nom courant"
            error={errors.name?.message}
            placeholder="Ex. Tornado, Filou, Houba"
            required
          >
            <input
              type="text"
              className={`input ${errors.name ? 'is-error' : ''}`}
              autoComplete="off"
              {...register('name')}
            />
          </Field>

          <FieldRow>
            <Field label="Espèce" error={errors.species?.message} required>
              <select
                className={`input ${errors.species ? 'is-error' : ''}`}
                {...register('species')}
                defaultValue=""
              >
                <option value="" disabled>
                  — Choisir l'espèce —
                </option>
                {SPECIES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sexe" error={errors.gender?.message} required>
              <select
                className={`input ${errors.gender ? 'is-error' : ''}`}
                {...register('gender')}
              >
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <Field
            label="Race"
            help="Optionnel · Border collie, Européen, Pur-sang…"
            error={errors.breed?.message}
          >
            <input
              type="text"
              className={`input ${errors.breed ? 'is-error' : ''}`}
              autoComplete="off"
              {...register('breed')}
            />
          </Field>
        </FormSection>

        {/* 02 — Naissance & identification */}
        <FormSection
          num="02"
          title="Naissance et identification"
          subtitle="Pour calculer l'âge et associer les protocoles vétérinaires applicables."
        >
          <FieldRow>
            <Field
              label="Date de naissance"
              help="Optionnel — si inconnue, laissez vide."
              error={errors.birth_date?.message}
            >
              <input
                type="date"
                className={`input ${errors.birth_date ? 'is-error' : ''}`}
                {...register('birth_date')}
              />
            </Field>
            <Field
              label="Numéro d'identification"
              help="Puce, ICAD, SIRE…"
              error={errors.identification_number?.message}
            >
              <input
                type="text"
                className={`input ${errors.identification_number ? 'is-error' : ''}`}
                autoComplete="off"
                {...register('identification_number')}
              />
            </Field>
          </FieldRow>
        </FormSection>

        {/* 03 — Localisation */}
        <FormSection
          num="03"
          title="Localisation"
          subtitle="Le département conditionne certaines obligations vaccinales (ex. rage en zone à risque)."
        >
          <Field
            label="Département"
            help="Code FR — 2 chiffres ou 2A/2B pour la Corse."
            error={errors.department_code?.message}
            required
          >
            <input
              type="text"
              maxLength={3}
              className={`input max-w-[140px] ${errors.department_code ? 'is-error' : ''}`}
              autoComplete="off"
              inputMode="text"
              {...register('department_code')}
            />
          </Field>
        </FormSection>

        {/* 04 — Notes */}
        <FormSection
          num="04"
          title="Notes"
          subtitle="Tout ce que vous voulez garder en mémoire. Visible uniquement par vous."
        >
          <Field label="Notes libres" error={errors.notes?.message}>
            <textarea
              rows={4}
              className={`input min-h-[120px] py-3 leading-relaxed ${errors.notes ? 'is-error' : ''}`}
              style={{ height: 'auto' }}
              {...register('notes')}
            />
          </Field>
        </FormSection>

        {/* Erreur globale */}
        {errors.root && (
          <div className="px-3.5 py-2.5 rounded-sm bg-status-over-tint text-status-over text-sm">
            {errors.root.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-6 border-t border-line">
          <Link to="/" className="btn-secondary">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-blocs
// ---------------------------------------------------------------------------

function FormSection({
  num,
  title,
  subtitle,
  children,
}: {
  num: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-10 gap-y-4 pb-2">
      <div>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep mb-2">
          {num} — {title}
        </p>
        {subtitle && (
          <p className="text-[13px] text-ink-soft leading-snug max-w-[200px]">
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function Field({
  label,
  help,
  error,
  required,
  placeholder: _placeholder,
  children,
}: {
  label: string
  help?: string
  error?: string
  required?: boolean
  placeholder?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="label flex items-center justify-between mb-1.5">
        <span>{label}</span>
        {required && (
          <span className="font-mono text-[9px] tracking-[0.06em] text-ink-soft normal-case">
            Requis
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-status-over">{error}</p>
      ) : help ? (
        <p className="mt-1.5 text-[12.5px] text-ink-soft">{help}</p>
      ) : null}
    </div>
  )
}
