# models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):

    NOTIFICATION_TYPES = [
        ("JOB_POSTED", "Job Posted"),
        ("APPLICATION_RECEIVED", "Application Received"),
        ("APPLICATION_STATUS", "Application Status"),
        ("INTERVIEW_SCHEDULED", "Interview Scheduled"),
        ("JOB_SAVED", "Job Saved"),
        ("SYSTEM", "System"),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    job = models.ForeignKey(
        "Jobportal.Job",
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    application = models.ForeignKey(
        "Jobportal.ApplyForm",
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient} - {self.title}"