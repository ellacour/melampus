from rest_framework import serializers
from .models import Animal


class AnimalSerializer(serializers.ModelSerializer):
    age_in_months = serializers.ReadOnlyField()
    species_display = serializers.CharField(source="get_species_display", read_only=True)
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)

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
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "age_in_months")

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)
