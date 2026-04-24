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
  created_at: string
  updated_at: string
}

export type CreateAnimalPayload = Omit<
  Animal,
  'id' | 'age_in_months' | 'species_display' | 'gender_display' | 'created_at' | 'updated_at'
>
