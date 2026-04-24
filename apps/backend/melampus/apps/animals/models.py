from django.db import models
from django.conf import settings
from melampus.apps.core.models import SoftDeleteModel


class Species(models.TextChoices):
    EQUINE = "equine", "Équidé"
    BOVINE = "bovine", "Bovin"
    OVINE = "ovine", "Ovin"
    CAPRINE = "caprine", "Caprin"
    PORCINE = "porcine", "Porcin"
    CANINE = "canine", "Canin"
    FELINE = "feline", "Félin"
    AVIAN = "avian", "Avicole"
    OTHER = "other", "Autre"


class Gender(models.TextChoices):
    MALE = "male", "Mâle"
    FEMALE = "female", "Femelle"
    UNKNOWN = "unknown", "Inconnu"


class Animal(SoftDeleteModel):
    """
    Core domain entity. Everything in Melampus revolves around an Animal.
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="animals",
    )
    name = models.CharField(max_length=255)
    species = models.CharField(max_length=50, choices=Species.choices)
    breed = models.CharField(max_length=255, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.UNKNOWN)
    birth_date = models.DateField(null=True, blank=True)
    identification_number = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Numéro de tatouage, puce, ou SIRE selon l'espèce",
    )
    photo = models.ImageField(upload_to="animals/photos/", null=True, blank=True)
    notes = models.TextField(blank=True)

    # Geographic context — used by the Rules Engine for vaccination recommendations
    department_code = models.CharField(
        max_length=5,
        blank=True,
        help_text="Code département français (ex: 31, 75, 2A)",
    )

    class Meta:
        db_table = "animals"
        verbose_name = "Animal"
        verbose_name_plural = "Animaux"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_species_display()})"

    @property
    def age_in_months(self) -> int | None:
        if not self.birth_date:
            return None
        from django.utils import timezone
        today = timezone.now().date()
        delta = today - self.birth_date
        return delta.days // 30
