from django.contrib import admin

from .models import CareEvent, RecurringCare


class CareEventInline(admin.TabularInline):
    model = CareEvent
    extra = 0
    fields = ("performed_at", "performed_by", "status", "recorded_by", "notes")
    readonly_fields = ()
    autocomplete_fields = ("recorded_by",)
    show_change_link = True


@admin.register(RecurringCare)
class RecurringCareAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "animal",
        "frequency_value",
        "frequency_unit",
        "start_date",
        "last_done_at",
        "next_due_at",
        "is_active",
    )
    list_filter = ("frequency_unit", "is_active")
    search_fields = ("name", "animal__name", "created_by__email")
    autocomplete_fields = ("animal", "created_by")
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    date_hierarchy = "next_due_at"
    ordering = ("next_due_at",)
    inlines = [CareEventInline]


@admin.register(CareEvent)
class CareEventAdmin(admin.ModelAdmin):
    list_display = (
        "recurring_care",
        "performed_at",
        "performed_by",
        "status",
        "recorded_by",
    )
    list_filter = ("status",)
    search_fields = (
        "recurring_care__name",
        "recurring_care__animal__name",
        "performed_by",
    )
    autocomplete_fields = ("recurring_care", "recorded_by")
    readonly_fields = ("created_at", "updated_at", "deleted_at")
    date_hierarchy = "performed_at"
    ordering = ("-performed_at",)
