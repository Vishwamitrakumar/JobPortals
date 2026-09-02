from django.db import models
from django.contrib.auth.models import User


class Resume(models.Model):

    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("analyzed", "Analyzed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="resumes"
    )

    file = models.FileField(
        upload_to="resumes/"
    )

    original_name = models.CharField(
        max_length=255
    )

    target_role = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    job_description = models.TextField(
        blank=True,
        null=True
    )

    ats_score = models.IntegerField(
        default=0
    )

    score_breakdown = models.JSONField(
        default=dict,
        blank=True
    )

    suggestions = models.JSONField(
        default=list,
        blank=True
    )

    analysis = models.JSONField(
        default=dict,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="uploaded"
    )

    error_message = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.original_name


class GeneratedResume(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="generated_resumes"
    )

    source_resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_resumes"
    )

    name = models.CharField(
        max_length=255
    )

    target_role = models.CharField(
        max_length=200
    )

    resume_data = models.JSONField(
        default=dict
    )

    ats_score = models.IntegerField(
        default=0
    )

    pdf_file = models.FileField(
        upload_to="generated_resumes/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name