from rest_framework import serializers
from ..model.notification import Notification


class NotificationSerializer(serializers.ModelSerializer):

    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "notification_type",
            "notification_type_display",
            "title",
            "message",
            "job",
            "application",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "notification_type_display",
            "created_at",
        ]