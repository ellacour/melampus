from rest_framework import serializers
from .models import RecurringCare, CareEvent


class RecurringCareSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    animal_name = serializers.CharField(source="animal.name", read_only=True)
    frequency_display = serializers.SerializerMethodField()

    class Meta:
        model = RecurringCare
        fields = (
            "id", "animal", "animal_name", "name", "description",
            "frequency_value", "frequency_unit", "frequency_display",
            "start_date", "last_done_at", "next_due_at",
            "is_active", "status", "created_at",
        )
        read_only_fields = ("id", "created_at", "status", "last_done_at", "next_due_at")

    def get_frequency_display(self, obj) -> str:
        return f"Tous les {obj.frequency_value} {obj.get_frequency_unit_display().lower()}"


class CareEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareEvent
        fields = (
            "id", "recurring_care", "performed_at", "performed_by",
            "notes", "status", "created_at",
        )
        read_only_fields = ("id", "created_at", "recorded_by")
