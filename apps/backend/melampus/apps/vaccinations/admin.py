from django.contrib import admin

from .models import VaccinationRecord, VaccinationRule


@admin.register(VaccinationRule)
class VaccinationRuleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "species",
        "min_age_months",
        "max_age_months",
        "frequency_days",
        "is_mandatory",
        "is_active",
    )
    list_filter = ("species", "is_mandatory", "is_active")
    search_fields = ("name", "description")
    ordering = ("name",)

    fieldsets = (
        (None, {"fields": ("name", "description", "is_active", "is_mandatory")}),
        (
            "Critères d'application",
            {
                "fields": (
                    "species",
                    "min_age_months",
                    "max_age_months",
                    "department_codes",
                ),
            },
        ),
        ("Fréquence", {"fields": ("frequency_days",)}),
    )


@admin.register(VaccinationRecord)
class VaccinationRecordAdmin(admin.ModelAdmin):
    list_display = (
        "vaccine_name",
        "animal",
        "administered_at",
        "next_due_at",
        "administered_by",
        "rule",
    )
    list_filter = ("rule",)
    search_fields = (
        "vaccine_name",
        "animal__name",
        "administered_by",
        "batch_number",
    )
    autocomplete_fields = ("animal", "rule", "recorded_by")
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    date_hierarchy = "administered_at"
    ordering = ("-administered_at",)
