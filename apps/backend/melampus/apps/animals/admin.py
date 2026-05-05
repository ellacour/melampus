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
        "department_code",
        "created_at",
    )
    list_filter = ("species", "gender", "department_code")
    search_fields = ("name", "identification_number", "owner__email")
    autocomplete_fields = ("owner",)
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    date_hierarchy = "created_at"
    ordering = ("name",)

    fieldsets = (
        (None, {"fields": ("owner", "name", "species", "breed", "gender", "birth_date")}),
        ("Identification", {"fields": ("identification_number", "photo")}),
        ("Contexte géographique", {"fields": ("department_code",)}),
        ("Notes", {"fields": ("notes",)}),
        ("Métadonnées", {"fields": ("created_at", "updated_at", "deleted_at")}),
    )
