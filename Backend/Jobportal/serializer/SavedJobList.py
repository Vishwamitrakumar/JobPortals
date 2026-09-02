from rest_framework import serializers
from ..model.savejob import SavedJob


class SavedJobSerializer(serializers.ModelSerializer):

    job_id = serializers.IntegerField(
        source="job.id",
        read_only=True
    )

    title = serializers.CharField(
        source="job.job_title",
        read_only=True
    )

    company = serializers.CharField(
        source="job.company_name",
        read_only=True
    )

    location = serializers.CharField(
        source="job.location",
        read_only=True
    )

    job_type = serializers.CharField(
        source="job.job_type",
        read_only=True
    )

    level = serializers.CharField(
        source="job.experience_level",
        read_only=True
    )

    category = serializers.CharField(
        source="job.job_category",
        read_only=True
    )

    logo = serializers.CharField(
        source="job.logo",
        read_only=True
    )

    class Meta:
        model = SavedJob

        fields = [
            "id",
            "job_id",
            "created_at",
            "title",
            "company",
            "location",
            "job_type",
            "level",
            "category",
            "logo",
        ]