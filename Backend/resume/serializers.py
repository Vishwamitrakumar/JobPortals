from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume
        fields = "__all__"
        read_only_fields = (
            "user",
            "skills",
            "job_title",
            "education",
            "experience_years",
            "extracted_text",
        )