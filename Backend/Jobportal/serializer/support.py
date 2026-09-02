from rest_framework import serializers

from ..model.support import (
    SupportConversation,
    SupportMessage
)


class SupportMessageSerializer(serializers.ModelSerializer):

    sender_name = serializers.CharField(
        source="sender.username",
        read_only=True
    )

    sender_id = serializers.IntegerField(
        source="sender.id",
        read_only=True
    )

    conversation_id = serializers.IntegerField(
        source="conversation.id",
        read_only=True
    )

    class Meta:
        model = SupportMessage

        fields = [
            "id",
            "sender",
            "sender_id",
            "sender_name",
            "sender_type",
            "message",
            "attachment",
            "created_at",
            "conversation_id",
        ]

        read_only_fields = [
            "id",
            "sender",
            "sender_id",
            "sender_name",
            "sender_type",
            "created_at",
            "conversation_id",
        ]


class SupportConversationSerializer(serializers.ModelSerializer):

    messages = SupportMessageSerializer(
        many=True,
        read_only=True
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = SupportConversation

        fields = [
            "id",
            "user",
            "username",
            "subject",
            "is_closed",
            "created_at",
            "updated_at",
            "messages",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "created_at",
            "updated_at",
            "messages",
        ]