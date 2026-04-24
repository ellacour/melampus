from rest_framework import serializers
from .models import VaccinationRecord, VaccinationRule


class VaccinationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinationRule
        fields = (
            "id", "name", "description", "species", "min_age_months",
            "max_age_months", "frequency_days", "is_mandatory",
        )


class VaccinationRecordSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    animal_name = serializers.CharField(source="animal.name", read_only=True)

    class Meta:
        model = VaccinationRecord
        fields = (
            "id", "animal", "animal_name", "rule", "vaccine_name",
            "administered_by", "administered_at", "next_due_at",
            "batch_number", "notes", "status", "created_at",
        )
        read_only_fields = ("id", "created_at", "status", "recorded_by")
