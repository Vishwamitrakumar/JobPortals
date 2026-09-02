from rest_framework import serializers

from ..model.savejob import SavedJob
from ..serializers import JobSerializer


class SavedJobSerializer(serializers.ModelSerializer):

    job_id = serializers.IntegerField(
        source="job.id",
        read_only=True
    )

    job = JobSerializer(read_only=True)

    class Meta:
        model = SavedJob

        fields = [
            "id",
            "job_id",
            "job",
            "created_at",
        ]