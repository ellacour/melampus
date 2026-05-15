from django.contrib import admin

from .models import Animal


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "species",
        "breed",
        "gender",
        "birth_date",
        "owner",
        "country",
        "department_code",
        "main_usage",
        "is_active",
        "created_at",
    )
    list_filter = ("species", "gender", "main_usage", "living_context", "is_active", "is_breeding_animal")
    search_fields = ("name", "identification_number", "owner__email")
    autocomplete_fields = ("owner",)
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    date_hierarchy = "created_at"
    ordering = ("name",)

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "owner",
                    "name",
                    "species",
                    "breed",
                    "gender",
                    "birth_date",
                    "identification_number",
                    "photo",
                )
            },
        ),
        (
            "Localisation",
            {"fields": ("country", "department_code")},
        ),
        (
            "Profil sanitaire",
            {
                "fields": (
                    "main_usage",
                    "living_context",
                    "travels_outside_home",
                    "external_animals_contact",
                    "has_young_or_pregnant_animals_on_site",
                )
            },
        ),
        (
            "Reproduction",
            {
                "fields": (
                    "is_breeding_animal",
                    "reproductive_status",
                    "expected_birth_date",
                )
            },
        ),
        (
            "Suivi",
            {"fields": ("is_active", "notes")},
        ),
        (
            "Métadonnées",
            {
                "fields": ("created_at", "updated_at", "deleted_at"),
                "classes": ("collapse",),
            },
        ),
    )
