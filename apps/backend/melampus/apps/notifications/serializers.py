from rest_framework import serializers
from .models import Notification, PushToken


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id", "notification_type", "channel", "title", "body",
            "is_read", "sent_at", "source_type", "source_id", "created_at",
        )
        read_only_fields = fields


class PushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushToken
        fields = ("id", "token", "device_label")
        read_only_fields = ("id",)
