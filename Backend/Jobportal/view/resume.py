from django.core.files.base import ContentFile
from django.http import FileResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..model.resume import Resume, GeneratedResume

from ..serializer.resume import (
    ResumeSerializer,
    GeneratedResumeSerializer,
)

from ..resume.gemini_service import GeminiResumeService
from ..resume.pdf_generator import generate_resume_pdf


class ResumeAnalyzeView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        resume_file = request.FILES.get(
            "file"
        )

        if not resume_file:

            return Response(
                {
                    "error": "Resume file is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if resume_file.size > 5 * 1024 * 1024:

            return Response(
                {
                    "error": "Maximum file size is 5MB."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_extensions = [
            ".pdf",
            ".doc",
            ".docx",
        ]

        name = resume_file.name.lower()

        if not any(
            name.endswith(ext)
            for ext in allowed_extensions
        ):

            return Response(
                {
                    "error": "Only PDF, DOC and DOCX files are allowed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        target_role = request.data.get(
            "target_role",
            ""
        )

        job_description = request.data.get(
            "job_description",
            ""
        )

        resume = Resume.objects.create(
            user=request.user,
            file=resume_file,
            original_name=resume_file.name,
            target_role=target_role,
            job_description=job_description,
        )

        try:

            service = GeminiResumeService()

            result = service.analyze_resume(
                resume.file,
                job_description
            )

            resume.ats_score = int(
                result.get(
                    "ats_score",
                    0
                )
            )

            resume.score_breakdown = result.get(
                "score_breakdown",
                {}
            )

            resume.suggestions = result.get(
                "suggestions",
                []
            )

            resume.analysis = result.get(
                "analysis",
                {}
            )

            resume.status = "analyzed"

            resume.save()

            return Response(
                ResumeSerializer(
                    resume,
                    context={
                        "request": request
                    }
                ).data
            )

        except Exception as e:

            resume.status = "failed"

            resume.error_message = str(e)

            resume.save()

            return Response(
                {
                    "error": str(e),
                    "resume_id": resume.id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResumeGenerateView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        resume_id = request.data.get(
            "resume_id"
        )

        target_role = request.data.get(
            "target_role"
        )

        job_description = request.data.get(
            "job_description"
        )

        if not resume_id:
            return Response(
                {
                    "error": "resume_id is required."
                },
                status=400
            )

        if not target_role:
            return Response(
                {
                    "error": "target_role is required."
                },
                status=400
            )

        if not job_description:
            return Response(
                {
                    "error": "job_description is required."
                },
                status=400
            )

        try:

            resume = Resume.objects.get(
                id=resume_id,
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=404
            )

        try:

            service = GeminiResumeService()

            resume_data = service.generate_resume(
                resume.file,
                target_role,
                job_description
            )

            ats_score = int(
                resume_data.get(
                    "ats_score",
                    0
                )
            )

            generated = GeneratedResume.objects.create(
                user=request.user,
                source_resume=resume,
                name=f"{target_role.replace(' ', '_')}_Resume.pdf",
                target_role=target_role,
                resume_data=resume_data,
                ats_score=ats_score,
            )

            pdf_buffer = generate_resume_pdf(
                resume_data
            )

            generated.pdf_file.save(
                generated.name,
                ContentFile(
                    pdf_buffer.getvalue()
                ),
                save=True
            )

            return Response(
                GeneratedResumeSerializer(
                    generated,
                    context={
                        "request": request
                    }
                ).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeneratedResumeListView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        resumes = GeneratedResume.objects.filter(
            user=request.user
        ).order_by(
            "-created_at"
        )

        serializer = GeneratedResumeSerializer(
            resumes,
            many=True,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data
        )


class GeneratedResumeDetailView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, pk):

        try:

            resume = GeneratedResume.objects.get(
                id=pk,
                user=request.user
            )

        except GeneratedResume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=404
            )

        return Response(
            GeneratedResumeSerializer(
                resume,
                context={
                    "request": request
                }
            ).data
        )


class GeneratedResumeDownloadView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, pk):

        try:

            resume = GeneratedResume.objects.get(
                id=pk,
                user=request.user
            )

        except GeneratedResume.DoesNotExist:

            return Response(
                {
                    "error": "Resume not found."
                },
                status=404
            )

        if not resume.pdf_file:

            return Response(
                {
                    "error": "PDF not available."
                },
                status=404
            )

        return FileResponse(
            resume.pdf_file.open("rb"),
            as_attachment=True,
            filename=resume.name
        )