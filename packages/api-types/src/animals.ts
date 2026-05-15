export type Species =
  | 'equine'
  | 'bovine'
  | 'ovine'
  | 'caprine'
  | 'porcine'
  | 'canine'
  | 'feline'
  | 'avian'
  | 'other'

export type Gender = 'male' | 'female' | 'unknown'

export type AnimalMainUsage =
  | 'leisure'
  | 'boarding'
  | 'competition'
  | 'breeding'
  | 'racing'
  | 'sales'
  | 'export'
  | 'company'
  | 'other'
  | 'unknown'

export type LivingContext =
  | 'alone'
  | 'closed_private_group'
  | 'boarding_stable'
  | 'competition_yard'
  | 'breeding_farm'
  | 'unknown'

export type ReproductiveStatus =
  | 'not_applicable'
  | 'empty'
  | 'pregnant'
  | 'with_young'
  | 'to_be_bred'
  | 'breeding_male'
  | 'retired_from_breeding'
  | 'unknown'

export interface Animal {
  id: string
  name: string
  species: Species
  species_display: string
  breed: string
  gender: Gender
  gender_display: string
  birth_date: string | null
  age_in_months: number | null
  identification_number: string
  photo: string | null
  notes: string
  department_code: string
  country: string
  main_usage: AnimalMainUsage
  main_usage_display: string
  living_context: LivingContext
  living_context_display: string
  travels_outside_home: boolean
  external_animals_contact: boolean
  has_young_or_pregnant_animals_on_site: boolean
  is_breeding_animal: boolean
  reproductive_status: ReproductiveStatus
  reproductive_status_display: string
  expected_birth_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateAnimalPayload = Omit<
  Animal,
  | 'id'
  | 'age_in_months'
  | 'species_display'
  | 'gender_display'
  | 'main_usage_display'
  | 'living_context_display'
  | 'reproductive_status_display'
  | 'created_at'
  | 'updated_at'
>
