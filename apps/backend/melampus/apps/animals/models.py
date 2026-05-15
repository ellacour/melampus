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


class AnimalMainUsage(models.TextChoices):
    LEISURE = "leisure", "Loisir"
    BOARDING = "boarding", "Pension"
    COMPETITION = "competition", "Compétition"
    BREEDING = "breeding", "Reproduction / élevage"
    RACING = "racing", "Courses"
    SALES = "sales", "Vente"
    EXPORT = "export", "Export"
    COMPANY = "company", "Compagnie"
    OTHER = "other", "Autre"
    UNKNOWN = "unknown", "Inconnu"


class LivingContext(models.TextChoices):
    ALONE = "alone", "Seul"
    CLOSED_PRIVATE_GROUP = "closed_private_group", "Groupe privé stable"
    BOARDING_STABLE = "boarding_stable", "Pension / écurie collective"
    COMPETITION_YARD = "competition_yard", "Écurie de sport / compétition"
    BREEDING_FARM = "breeding_farm", "Élevage"
    UNKNOWN = "unknown", "Inconnu"


class ReproductiveStatus(models.TextChoices):
    NOT_APPLICABLE = "not_applicable", "Non applicable"
    EMPTY = "empty", "Vide"
    PREGNANT = "pregnant", "Gestante"
    WITH_YOUNG = "with_young", "Suitée / avec petit"
    TO_BE_BRED = "to_be_bred", "À faire reproduire"
    BREEDING_MALE = "breeding_male", "Reproducteur mâle"
    RETIRED_FROM_BREEDING = "retired_from_breeding", "Retiré de la reproduction"
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
    country = models.CharField(
        max_length=2,
        default="FR",
        db_index=True,
        help_text="Code pays ISO 3166-1 alpha-2 utilisé par le moteur de règles sanitaires.",
    )

    # Vaccination rules context
    main_usage = models.CharField(
        max_length=50,
        choices=AnimalMainUsage.choices,
        default=AnimalMainUsage.UNKNOWN,
        db_index=True,
        help_text="Usage principal de l'animal pour déterminer les règles sanitaires applicables.",
    )
    living_context = models.CharField(
        max_length=50,
        choices=LivingContext.choices,
        default=LivingContext.UNKNOWN,
        db_index=True,
        help_text="Contexte de vie de l'animal : seul, groupe privé, pension, élevage, etc.",
    )
    travels_outside_home = models.BooleanField(
        default=False,
        help_text="Indique si l'animal sort régulièrement de son lieu de vie : concours, transport, stages, saillie, soins, etc.",
    )
    external_animals_contact = models.BooleanField(
        default=False,
        help_text="Indique si l'animal est en contact avec des animaux extérieurs à son groupe habituel.",
    )
    has_young_or_pregnant_animals_on_site = models.BooleanField(
        default=False,
        help_text="Indique la présence de jeunes animaux ou de femelles gestantes sur le lieu de vie.",
    )

    # Reproductive context
    is_breeding_animal = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Indique si l'animal est utilisé ou destiné à la reproduction.",
    )
    reproductive_status = models.CharField(
        max_length=50,
        choices=ReproductiveStatus.choices,
        default=ReproductiveStatus.NOT_APPLICABLE,
        help_text="Statut reproducteur de l'animal.",
    )
    expected_birth_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date prévue de mise bas / naissance, si applicable.",
    )

    # Lifecycle
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Permet de désactiver les rappels pour un animal vendu, décédé ou archivé.",
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
