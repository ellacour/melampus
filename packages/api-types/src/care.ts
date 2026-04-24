export type FrequencyUnit = 'day' | 'week' | 'month' | 'year'
export type CareStatus = 'pending' | 'done' | 'skipped' | 'overdue'

export interface RecurringCare {
  id: string
  animal: string
  animal_name: string
  name: string
  description: string
  frequency_value: number
  frequency_unit: FrequencyUnit
  frequency_display: string
  start_date: string
  last_done_at: string | null
  next_due_at: string | null
  is_active: boolean
  status: CareStatus
  created_at: string
}

export interface CareEvent {
  id: string
  recurring_care: string
  performed_at: string
  performed_by: string
  notes: string
  status: CareStatus
  created_at: string
}
