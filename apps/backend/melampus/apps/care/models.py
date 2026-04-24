"""
Recurring care module.
Handles all repeating health interventions that are not vaccinations
(vermifugation, soins dentaires, maréchalerie, etc.)
"""
from django.db import models
from django.conf import settings
from melampus.apps.core.models import SoftDeleteModel
from melampus.apps.animals.models import Animal


class FrequencyUnit(models.TextChoices):
    DAY = "day", "Jour(s)"
    WEEK = "week", "Semaine(s)"
    MONTH = "month", "Mois"
    YEAR = "year", "An(s)"


class CareStatus(models.TextChoices):
    PENDING = "pending", "À faire"
    DONE = "done", "Réalisé"
    SKIPPED = "skipped", "Ignoré"
    OVERDUE = "overdue", "En retard"


class RecurringCare(SoftDeleteModel):
    """
    Defines a recurring care protocol for an animal.
    Example: "Vermifugation de Tornado toutes les 3 mois"
    """
    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="recurring_cares"
    )
    name = models.CharField(max_length=255, help_text="Ex: Vermifugation, Soins dentaires")
    description = models.TextField(blank=True)
    frequency_value = models.PositiveIntegerField(help_text="Ex: 3")
    frequency_unit = models.CharField(
        max_length=10, choices=FrequencyUnit.choices, default=FrequencyUnit.MONTH
    )
    start_date = models.DateField()
    last_done_at = models.DateField(null=True, blank=True)
    next_due_at = models.DateField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="recurring_cares",
    )

    class Meta:
        db_table = "recurring_cares"
        verbose_name = "Soin récurrent"
        verbose_name_plural = "Soins récurrents"
        ordering = ["next_due_at"]

    def __str__(self):
        return f"{self.name} — {self.animal.name}"

    def compute_next_due(self, from_date=None) -> None:
        """Recompute next_due_at based on frequency."""
        from django.utils import timezone
        from dateutil.relativedelta import relativedelta
        base = from_date or self.last_done_at or self.start_date
        unit = self.frequency_unit
        value = self.frequency_value

        if unit == FrequencyUnit.DAY:
            self.next_due_at = base + relativedelta(days=value)
        elif unit == FrequencyUnit.WEEK:
            self.next_due_at = base + relativedelta(weeks=value)
        elif unit == FrequencyUnit.MONTH:
            self.next_due_at = base + relativedelta(months=value)
        elif unit == FrequencyUnit.YEAR:
            self.next_due_at = base + relativedelta(years=value)

    @property
    def status(self) -> str:
        if not self.next_due_at:
            return CareStatus.PENDING
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        if today > self.next_due_at:
            return CareStatus.OVERDUE
        return CareStatus.PENDING


class CareEvent(SoftDeleteModel):
    """
    A single occurrence of a care being performed.
    """
    recurring_care = models.ForeignKey(
        RecurringCare, on_delete=models.CASCADE, related_name="events"
    )
    performed_at = models.DateField()
    performed_by = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=CareStatus.choices, default=CareStatus.DONE
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="care_events",
    )

    class Meta:
        db_table = "care_events"
        verbose_name = "Événement de soin"
        verbose_name_plural = "Événements de soins"
        ordering = ["-performed_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update parent recurring care after recording an event
        if self.status == CareStatus.DONE:
            care = self.recurring_care
            care.last_done_at = self.performed_at
            care.compute_next_due()
            care.save(update_fields=["last_done_at", "next_due_at", "updated_at"])
