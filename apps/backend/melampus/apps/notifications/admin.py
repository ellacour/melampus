from django.contrib import admin

from .models import Notification, PushToken


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "device_label", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("user__email", "token", "device_label")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "notification_type",
        "channel",
        "is_read",
        "sent_at",
        "created_at",
    )
    list_filter = ("notification_type", "channel", "is_read")
    search_fields = ("title", "body", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
