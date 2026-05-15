from rest_framework import serializers
from .models import Animal, AnimalMainUsage, ReproductiveStatus, Gender


class AnimalSerializer(serializers.ModelSerializer):
    age_in_months = serializers.ReadOnlyField()
    species_display = serializers.CharField(source="get_species_display", read_only=True)
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)
    main_usage_display = serializers.CharField(source="get_main_usage_display", read_only=True)
    living_context_display = serializers.CharField(source="get_living_context_display", read_only=True)
    reproductive_status_display = serializers.CharField(source="get_reproductive_status_display", read_only=True)

    class Meta:
        model = Animal
        fields = (
            "id",
            "name",
            "species",
            "species_display",
            "breed",
            "gender",
            "gender_display",
            "birth_date",
            "age_in_months",
            "identification_number",
            "photo",
            "notes",
            "department_code",
            "country",
            "main_usage",
            "main_usage_display",
            "living_context",
            "living_context_display",
            "travels_outside_home",
            "external_animals_contact",
            "has_young_or_pregnant_animals_on_site",
            "is_breeding_animal",
            "reproductive_status",
            "reproductive_status_display",
            "expected_birth_date",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "age_in_months")

    def validate_main_usage(self, value):
        if self.context.get("request") and self.context["request"].method == "POST":
            if value == AnimalMainUsage.UNKNOWN:
                raise serializers.ValidationError(
                    "L'usage principal de l'animal est requis à la création."
                )
        return value

    def validate_country(self, value):
        if len(value) != 2 or not value.isalpha():
            raise serializers.ValidationError(
                "Le code pays doit être un code ISO 3166-1 alpha-2 (ex : FR, BE, ES)."
            )
        return value.upper()

    def validate(self, data):
        gender = data.get("gender", getattr(self.instance, "gender", None))
        reproductive_status = data.get(
            "reproductive_status",
            getattr(self.instance, "reproductive_status", ReproductiveStatus.NOT_APPLICABLE),
        )
        is_breeding_animal = data.get(
            "is_breeding_animal",
            getattr(self.instance, "is_breeding_animal", False),
        )
        expected_birth_date = data.get(
            "expected_birth_date",
            getattr(self.instance, "expected_birth_date", None),
        )

        male_only_statuses = {ReproductiveStatus.PREGNANT, ReproductiveStatus.WITH_YOUNG}
        if gender == Gender.MALE and reproductive_status in male_only_statuses:
            raise serializers.ValidationError({
                "reproductive_status": (
                    "Les statuts 'Gestante' et 'Suitée / avec petit' ne sont pas compatibles avec un animal mâle."
                )
            })

        if reproductive_status == ReproductiveStatus.PREGNANT and not expected_birth_date:
            raise serializers.ValidationError({
                "expected_birth_date": (
                    "La date prévue de mise bas est requise lorsque le statut reproducteur est 'Gestante'."
                )
            })

        if is_breeding_animal and reproductive_status == ReproductiveStatus.NOT_APPLICABLE:
            raise serializers.ValidationError({
                "reproductive_status": (
                    "Un animal reproducteur ne peut pas avoir le statut 'Non applicable'. "
                    "Veuillez préciser son statut reproducteur."
                )
            })

        return data

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)
