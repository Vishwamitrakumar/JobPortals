from django.db import models
from django.conf import settings


class SupportConversation(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_conversations"
    )

    subject = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_closed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.subject}"


class SupportMessage(models.Model):

    SENDER_CHOICES = (
        ("user", "User"),
        ("support", "Support"),
    )

    conversation = models.ForeignKey(
        SupportConversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_support_messages"
    )

    sender_type = models.CharField(
        max_length=20,
        choices=SENDER_CHOICES
    )

    message = models.TextField()

    attachment = models.FileField(
        upload_to="support/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} - {self.sender_type}"