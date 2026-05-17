/**
 * Création d'un dossier animal.
 *
 * Form structuré en sections numérotées :
 *   01 Identité + usage principal
 *   02 Naissance et identification
 *   03 Localisation (département optionnel, pays prérempli FR)
 *   04 Profil sanitaire (dépliable, optionnel)
 *   05 Notes
 *
 * Validation Zod côté front pour le feedback immédiat.
 * Les validations croisées (genre/statut reproducteur, animal gestant) sont
 * aussi enforced côté API — le front les réplique pour l'UX.
 */
import { ReactNode, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import type { Animal, AnimalMainUsage, Gender, LivingContext, ReproductiveStatus, Species } from '@melampus/api-types'
import { apiClient } from '../../api/client'

// ---------------------------------------------------------------------------
// Options
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

const MAIN_USAGE_OPTIONS: ReadonlyArray<{ value: AnimalMainUsage; label: string }> = [
  { value: 'leisure', label: 'Loisir' },
  { value: 'boarding', label: 'Pension' },
  { value: 'competition', label: 'Compétition' },
  { value: 'breeding', label: 'Reproduction / élevage' },
  { value: 'racing', label: 'Courses' },
  { value: 'sales', label: 'Vente' },
  { value: 'export', label: 'Export' },
  { value: 'company', label: 'Compagnie' },
  { value: 'other', label: 'Autre' },
]

const LIVING_CONTEXT_OPTIONS: ReadonlyArray<{ value: LivingContext; label: string }> = [
  { value: 'alone', label: 'Seul' },
  { value: 'closed_private_group', label: 'Groupe privé stable' },
  { value: 'boarding_stable', label: 'Pension / écurie collective' },
  { value: 'competition_yard', label: 'Écurie de sport / compétition' },
  { value: 'breeding_farm', label: 'Élevage' },
]

const REPRODUCTIVE_STATUS_OPTIONS: ReadonlyArray<{ value: ReproductiveStatus; label: string }> = [
  { value: 'not_applicable', label: 'Non applicable' },
  { value: 'empty', label: 'Vide' },
  { value: 'pregnant', label: 'Gestante' },
  { value: 'with_young', label: 'Suitée / avec petit' },
  { value: 'to_be_bred', label: 'À faire reproduire' },
  { value: 'breeding_male', label: 'Reproducteur mâle' },
  { value: 'retired_from_breeding', label: 'Retiré de la reproduction' },
  { value: 'unknown', label: 'Inconnu' },
]

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const animalSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Le nom est requis.')
      .max(80, '80 caractères maximum.'),
    species: z.enum([
      'canine', 'feline', 'equine', 'bovine', 'ovine', 'caprine', 'porcine', 'avian', 'other',
    ]),
    gender: z.enum(['male', 'female', 'unknown']),
    main_usage: z.enum([
      'leisure', 'boarding', 'competition', 'breeding', 'racing', 'sales', 'export', 'company', 'other',
    ], { required_error: "L'usage principal est requis." }),
    breed: z.string().trim().max(80, '80 caractères maximum.').optional(),
    birth_date: z
      .string()
      .optional()
      .refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Date invalide (AAAA-MM-JJ).'),
    identification_number: z.string().trim().max(60, '60 caractères maximum.').optional(),
    // Localisation
    country: z.string().length(2).default('FR'),
    department_code: z
      .string()
      .trim()
      .regex(/^(\d{2,3}|2A|2B)$/i, 'Code département FR (2 chiffres ou 2A/2B).')
      .transform(v => v.toUpperCase())
      .optional()
      .or(z.literal('')),
    // Profil sanitaire
    living_context: z
      .enum(['alone', 'closed_private_group', 'boarding_stable', 'competition_yard', 'breeding_farm', 'unknown'])
      .optional(),
    travels_outside_home: z.boolean().default(false),
    external_animals_contact: z.boolean().default(false),
    has_young_or_pregnant_animals_on_site: z.boolean().default(false),
    // Reproduction
    is_breeding_animal: z.boolean().default(false),
    reproductive_status: z
      .enum([
        'not_applicable', 'empty', 'pregnant', 'with_young', 'to_be_bred',
        'breeding_male', 'retired_from_breeding', 'unknown',
      ])
      .default('not_applicable'),
    expected_birth_date: z
      .string()
      .optional()
      .refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Date invalide (AAAA-MM-JJ).'),
    notes: z.string().trim().max(2000, '2000 caractères maximum.').optional(),
  })
  .superRefine((data, ctx) => {
    const isMale = data.gender === 'male'
    if (isMale && (data.reproductive_status === 'pregnant' || data.reproductive_status === 'with_young')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reproductive_status'],
        message: "Les statuts 'Gestante' et 'Suitée' ne sont pas compatibles avec un mâle.",
      })
    }
    if (data.reproductive_status === 'pregnant' && !data.expected_birth_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expected_birth_date'],
        message: 'La date prévue de mise bas est requise pour un animal gestant.',
      })
    }
    if (data.is_breeding_animal && data.reproductive_status === 'not_applicable') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reproductive_status'],
        message: "Précisez le statut reproducteur d'un animal reproducteur.",
      })
    }
  })

type AnimalForm = z.infer<typeof animalSchema>

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CreateAnimalPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [healthProfileOpen, setHealthProfileOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      gender: 'unknown',
      country: 'FR',
      travels_outside_home: false,
      external_animals_contact: false,
      has_young_or_pregnant_animals_on_site: false,
      is_breeding_animal: false,
      reproductive_status: 'not_applicable',
    },
  })

  const gender = useWatch({ control, name: 'gender' })
  const isBreedingAnimal = useWatch({ control, name: 'is_breeding_animal' })
  const reproductiveStatus = useWatch({ control, name: 'reproductive_status' })

  const showReproductiveFields = gender === 'female' || isBreedingAnimal
  const showExpectedBirthDate = reproductiveStatus === 'pregnant'

  const reproductiveStatusOptions = REPRODUCTIVE_STATUS_OPTIONS.filter(opt => {
    if (gender === 'male') return opt.value !== 'pregnant' && opt.value !== 'with_young'
    return true
  })

  const mutation = useMutation({
    mutationFn: async (data: AnimalForm) => {
      const payload = {
        name: data.name,
        species: data.species,
        gender: data.gender,
        main_usage: data.main_usage,
        breed: data.breed ?? '',
        birth_date: data.birth_date || null,
        identification_number: data.identification_number ?? '',
        photo: null,
        notes: data.notes ?? '',
        country: data.country,
        department_code: data.department_code || '',
        living_context: data.living_context ?? 'unknown',
        travels_outside_home: data.travels_outside_home,
        external_animals_contact: data.external_animals_contact,
        has_young_or_pregnant_animals_on_site: data.has_young_or_pregnant_animals_on_site,
        is_breeding_animal: data.is_breeding_animal,
        reproductive_status: data.reproductive_status,
        expected_birth_date: data.expected_birth_date || null,
        is_active: true,
      }
      const response = await apiClient.post<Animal>('/animals/', payload)
      return response.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['animals'] })
      void queryClient.invalidateQueries({ queryKey: ['vaccinations'] })
      void queryClient.invalidateQueries({ queryKey: ['care'] })
      navigate('/')
    },
    onError: () => {
      setError('root', {
        message: 'Impossible de créer le dossier. Vérifiez les champs ou réessayez.',
      })
    },
  })

  return (
    <div className="max-w-[760px]">
      <header className="mb-10">
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft mb-3">
          Ajout d'un dossier
        </span>
        <h1 className="text-[36px] font-semibold tracking-[-0.025em] leading-[1.1] mb-2">
          Nouvel animal.
        </h1>
        <p className="text-[15px] text-ink-soft max-w-[580px]">
          Renseignez les informations de base. Vous pourrez ajouter vaccinations et soins juste après.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(data => mutation.mutate(data))}
        noValidate
        className="space-y-10"
      >
        {/* 01 — Identité */}
        <FormSection
          num="01"
          title="Identité"
          subtitle="Nom, espèce, sexe et usage principal de l'animal."
        >
          <Field label="Nom courant" error={errors.name?.message} required>
            <input
              type="text"
              className={`input ${errors.name ? 'is-error' : ''}`}
              autoComplete="off"
              placeholder="Ex. Tornado, Filou, Houba"
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
                <option value="" disabled>— Choisir l'espèce —</option>
                {SPECIES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Sexe" error={errors.gender?.message} required>
              <select
                className={`input ${errors.gender ? 'is-error' : ''}`}
                {...register('gender')}
              >
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <Field
            label="Usage principal"
            help="Détermine les règles sanitaires et vaccinales applicables."
            error={errors.main_usage?.message}
            required
          >
            <select
              className={`input ${errors.main_usage ? 'is-error' : ''}`}
              {...register('main_usage')}
              defaultValue=""
            >
              <option value="" disabled>— Choisir l'usage —</option>
              {MAIN_USAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

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
          subtitle="Le département conditionne certaines obligations vaccinales."
        >
          <Field
            label="Département"
            help="Optionnel — code FR, 2 chiffres ou 2A/2B pour la Corse."
            error={errors.department_code?.message}
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

        {/* 04 — Profil sanitaire (dépliable) */}
        <section className="border border-line rounded-sm">
          <button
            type="button"
            onClick={() => setHealthProfileOpen(o => !o)}
            className="w-full grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-10 gap-y-4 p-6 text-left"
            aria-expanded={healthProfileOpen}
          >
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep mb-2">
                04 — Profil sanitaire
              </p>
              <p className="text-[13px] text-ink-soft leading-snug max-w-[200px]">
                Optionnel à la création. Nécessaire pour activer le suivi vaccinal intelligent.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-ink-soft">
              <span>{healthProfileOpen ? 'Réduire' : 'Compléter maintenant'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${healthProfileOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {healthProfileOpen && (
            <div className="px-6 pb-6 space-y-6 border-t border-line pt-6">
              {/* Contexte de vie */}
              <Field
                label="Contexte de vie"
                help="Comment l'animal est-il hébergé au quotidien ?"
                error={errors.living_context?.message}
              >
                <select
                  className={`input ${errors.living_context ? 'is-error' : ''}`}
                  {...register('living_context')}
                  defaultValue=""
                >
                  <option value="">— Non renseigné —</option>
                  {LIVING_CONTEXT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>

              {/* Expositions */}
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-ink">Expositions et contacts</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" {...register('travels_outside_home')} />
                  <span className="text-[14px] text-ink">
                    Sort régulièrement de son lieu de vie
                    <span className="block text-[12.5px] text-ink-soft mt-0.5">
                      Concours, transport, stages, saillie, soins à l'extérieur…
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" {...register('external_animals_contact')} />
                  <span className="text-[14px] text-ink">
                    En contact avec des animaux extérieurs au groupe habituel
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" {...register('has_young_or_pregnant_animals_on_site')} />
                  <span className="text-[14px] text-ink">
                    Jeunes animaux ou femelles gestantes présents sur le site
                  </span>
                </label>
              </div>

              {/* Reproduction */}
              <div className="space-y-4">
                <p className="text-[13px] font-medium text-ink">Reproduction</p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" {...register('is_breeding_animal')} />
                  <span className="text-[14px] text-ink">
                    Animal utilisé ou destiné à la reproduction
                  </span>
                </label>

                {showReproductiveFields && (
                  <Field
                    label="Statut reproducteur"
                    error={errors.reproductive_status?.message}
                  >
                    <select
                      className={`input ${errors.reproductive_status ? 'is-error' : ''}`}
                      {...register('reproductive_status')}
                    >
                      {reproductiveStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {showExpectedBirthDate && (
                  <Field
                    label="Date prévue de mise bas"
                    help="Requise si l'animal est gestant."
                    error={errors.expected_birth_date?.message}
                    required
                  >
                    <input
                      type="date"
                      className={`input ${errors.expected_birth_date ? 'is-error' : ''}`}
                      {...register('expected_birth_date')}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 05 — Notes */}
        <FormSection
          num="05"
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
  children,
}: {
  label: string
  help?: string
  error?: string | undefined
  required?: boolean
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
