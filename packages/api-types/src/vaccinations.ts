export type VaccinationStatus = 'up_to_date' | 'due_soon' | 'overdue' | 'not_applicable'

export interface VaccinationRule {
  id: number
  name: string
  description: string
  species: string
  min_age_months: number | null
  max_age_months: number | null
  frequency_days: number
  is_mandatory: boolean
}

export interface VaccinationRecord {
  id: string
  animal: string
  animal_name: string
  rule: number | null
  vaccine_name: string
  administered_by: string
  administered_at: string
  next_due_at: string | null
  batch_number: string
  notes: string
  status: VaccinationStatus
  created_at: string
}
