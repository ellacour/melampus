"""
Celery tasks for sending reminders.
These run on a schedule defined in the admin via django-celery-beat.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name="notifications.check_vaccination_reminders")
def check_vaccination_reminders():
    """
    Daily task: find vaccinations due in 7 days or overdue.
    Creates in-app notifications for affected users.
    """
    from melampus.apps.vaccinations.models import VaccinationRecord
    from melampus.apps.notifications.models import Notification, NotificationType, NotificationChannel

    today = timezone.now().date()
    reminder_threshold = today + timedelta(days=7)

    due_soon = VaccinationRecord.objects.filter(
        next_due_at__lte=reminder_threshold,
        next_due_at__gte=today,
        deleted_at__isnull=True,
    ).select_related("animal__owner")

    overdue = VaccinationRecord.objects.filter(
        next_due_at__lt=today,
        deleted_at__isnull=True,
    ).select_related("animal__owner")

    count = 0
    for record in due_soon:
        Notification.objects.create(
            user=record.animal.owner,
            notification_type=NotificationType.VACCINATION_DUE,
            channel=NotificationChannel.IN_APP,
            title=f"Vaccination à venir — {record.animal.name}",
            body=f"{record.vaccine_name} est due le {record.next_due_at.strftime('%d/%m/%Y')}.",
            source_type="vaccination_record",
            source_id=record.id,
        )
        count += 1

    for record in overdue:
        Notification.objects.create(
            user=record.animal.owner,
            notification_type=NotificationType.VACCINATION_OVERDUE,
            channel=NotificationChannel.IN_APP,
            title=f"Vaccination en retard — {record.animal.name}",
            body=f"{record.vaccine_name} était due le {record.next_due_at.strftime('%d/%m/%Y')}.",
            source_type="vaccination_record",
            source_id=record.id,
        )
        count += 1

    logger.info(f"check_vaccination_reminders: {count} notifications créées.")
    return count


@shared_task(name="notifications.check_care_reminders")
def check_care_reminders():
    """Daily task: find recurring cares due or overdue."""
    from melampus.apps.care.models import RecurringCare
    from melampus.apps.notifications.models import Notification, NotificationType, NotificationChannel

    today = timezone.now().date()
    reminder_threshold = today + timedelta(days=7)

    due_or_overdue = RecurringCare.objects.filter(
        next_due_at__lte=reminder_threshold,
        is_active=True,
        deleted_at__isnull=True,
    ).select_related("animal__owner")

    count = 0
    for care in due_or_overdue:
        is_overdue = care.next_due_at < today
        Notification.objects.create(
            user=care.animal.owner,
            notification_type=NotificationType.CARE_OVERDUE if is_overdue else NotificationType.CARE_DUE,
            channel=NotificationChannel.IN_APP,
            title=f"{'Soin en retard' if is_overdue else 'Soin à prévoir'} — {care.animal.name}",
            body=f"{care.name} {'était dû' if is_overdue else 'est dû'} le {care.next_due_at.strftime('%d/%m/%Y')}.",
            source_type="recurring_care",
            source_id=care.id,
        )
        count += 1

    logger.info(f"check_care_reminders: {count} notifications créées.")
    return count
