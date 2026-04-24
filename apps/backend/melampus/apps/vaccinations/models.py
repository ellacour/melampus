"""
Vaccination module.
The Rules Engine lives here — it determines which vaccines are recommended
for a given animal based on species, age, and geographic zone.
"""
from django.db import models
from django.conf import settings
from melampus.apps.core.models import SoftDeleteModel
from melampus.apps.animals.models import Animal


class VaccinationStatus(models.TextChoices):
    UP_TO_DATE = "up_to_date", "À jour"
    DUE_SOON = "due_soon", "Bientôt dû"
    OVERDUE = "overdue", "En retard"
    NOT_APPLICABLE = "not_applicable", "Non applicable"


class VaccinationRule(models.Model):
    """
    A vaccination rule defines which vaccine is required for which animals.
    Managed via admin — not hardcoded. This is the Rules Engine.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    species = models.CharField(max_length=50, help_text="Espèce concernée (ou 'all')")
    min_age_months = models.PositiveIntegerField(
        null=True, blank=True, help_text="Âge minimum en mois"
    )
    max_age_months = models.PositiveIntegerField(
        null=True, blank=True, help_text="Âge maximum en mois"
    )
    department_codes = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste de codes département (vide = national)",
    )
    frequency_days = models.PositiveIntegerField(
        help_text="Fréquence de rappel en jours (ex: 365 pour annuel)"
    )
    is_mandatory = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "vaccination_rules"
        verbose_name = "Règle de vaccination"
        verbose_name_plural = "Règles de vaccination"

    def __str__(self):
        return self.name

    def applies_to(self, animal: Animal) -> bool:
        """Check if this rule applies to a given animal."""
        if self.species != "all" and animal.species != self.species:
            return False
        age = animal.age_in_months
        if age is not None:
            if self.min_age_months and age < self.min_age_months:
                return False
            if self.max_age_months and age > self.max_age_months:
                return False
        if self.department_codes and animal.department_code not in self.department_codes:
            return False
        return True


class VaccinationRecord(SoftDeleteModel):
    """
    A recorded vaccination event for a specific animal.
    """
    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="vaccinations"
    )
    rule = models.ForeignKey(
        VaccinationRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="records",
    )
    vaccine_name = models.CharField(max_length=255)
    administered_by = models.CharField(max_length=255, blank=True, help_text="Nom du vétérinaire")
    administered_at = models.DateField()
    next_due_at = models.DateField(null=True, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vaccination_records",
    )

    class Meta:
        db_table = "vaccination_records"
        verbose_name = "Vaccination"
        verbose_name_plural = "Vaccinations"
        ordering = ["-administered_at"]

    def __str__(self):
        return f"{self.vaccine_name} — {self.animal.name} ({self.administered_at})"

    def save(self, *args, **kwargs):
        # Auto-calculate next_due_at from the rule if not set
        if not self.next_due_at and self.rule:
            from datetime import timedelta
            self.next_due_at = self.administered_at + timedelta(days=self.rule.frequency_days)
        super().save(*args, **kwargs)

    @property
    def status(self) -> str:
        if not self.next_due_at:
            return VaccinationStatus.NOT_APPLICABLE
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        if today > self.next_due_at:
            return VaccinationStatus.OVERDUE
        if today >= self.next_due_at - timedelta(days=30):
            return VaccinationStatus.DUE_SOON
        return VaccinationStatus.UP_TO_DATE
