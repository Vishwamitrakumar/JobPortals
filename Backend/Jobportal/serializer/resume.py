from rest_framework import serializers
from ..model.resume import Resume, GeneratedResume


class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume

        fields = [
            "id",
            "original_name",
            "file",
            "target_role",
            "job_description",
            "ats_score",
            "score_breakdown",
            "suggestions",
            "analysis",
            "status",
            "error_message",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "ats_score",
            "score_breakdown",
            "suggestions",
            "analysis",
            "status",
            "error_message",
            "created_at",
        ]


class GeneratedResumeSerializer(serializers.ModelSerializer):

    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedResume

        fields = [
            "id",
            "name",
            "target_role",
            "resume_data",
            "ats_score",
            "pdf_url",
            "created_at",
        ]

    def get_pdf_url(self, obj):

        if not obj.pdf_file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.pdf_file.url
            )

        return obj.pdf_file.url