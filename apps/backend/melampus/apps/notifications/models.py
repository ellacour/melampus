from django.db import models
from django.conf import settings
from melampus.apps.core.models import TimeStampedModel


class NotificationChannel(models.TextChoices):
    PUSH = "push", "Push mobile"
    EMAIL = "email", "Email"
    IN_APP = "in_app", "In-app"


class NotificationType(models.TextChoices):
    VACCINATION_DUE = "vaccination_due", "Vaccination à venir"
    VACCINATION_OVERDUE = "vaccination_overdue", "Vaccination en retard"
    CARE_DUE = "care_due", "Soin à venir"
    CARE_OVERDUE = "care_overdue", "Soin en retard"


class PushToken(TimeStampedModel):
    """Stores Expo push tokens for mobile notifications."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_tokens",
    )
    token = models.CharField(max_length=255, unique=True)
    device_label = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "push_tokens"

    def __str__(self):
        return f"{self.user.email} — {self.token[:30]}..."


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    # Generic FK to the source object (vaccination, care event, etc.)
    source_type = models.CharField(max_length=50, blank=True)
    source_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
