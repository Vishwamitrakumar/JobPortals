from django.db import models
from django.conf import settings


class Resume(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resume"
    )

    file = models.FileField(upload_to="resumes/")

    extracted_text = models.TextField(blank=True)

    skills = models.JSONField(default=list)

    experience_years = models.FloatField(default=0)

    job_title = models.CharField(
        max_length=200,
        blank=True
    )

    education = models.CharField(
        max_length=300,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email