export type NotificationType =
  | 'vaccination_due'
  | 'vaccination_overdue'
  | 'care_due'
  | 'care_overdue'

export type NotificationChannel = 'push' | 'email' | 'in_app'

export interface Notification {
  id: string
  notification_type: NotificationType
  channel: NotificationChannel
  title: string
  body: string
  is_read: boolean
  sent_at: string | null
  source_type: string
  source_id: string | null
  created_at: string
}
