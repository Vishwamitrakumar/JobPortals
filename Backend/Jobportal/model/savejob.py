from django.db import models
from django.conf import settings


class SavedJob(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_jobs"
    )

    job = models.ForeignKey(
        "Job",
        on_delete=models.CASCADE,
        related_name="saved_by_users"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "job"],
                name="unique_saved_job_per_user"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.job.job_title}"