from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Resume
from .serializers import ResumeSerializer

from .services.pdf_reader import extract_pdf_text
from .services.skill_extractor import extract_skills
import cloudinary.uploader

class ResumeAPIView(APIView):

    permission_classes = [IsAuthenticated]

    # =========================
    # GET - Current Resume
    # =========================

    def get(self, request):

        try:
            resume = Resume.objects.get(
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "resume": None,
                    "message": "Resume not uploaded"
                },
                status=status.HTTP_200_OK
            )

        serializer = ResumeSerializer(resume)

        return Response(
            {
                "resume": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # =========================
    # POST - Upload Resume
    # =========================

    def post(self, request):

        resume_file = request.FILES.get("resume")

        if not resume_file:

            return Response(
                {
                    "error": "Resume is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not resume_file.name.lower().endswith(".pdf"):

            return Response(
                {
                    "error": "Only PDF files are allowed"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already exists
        if Resume.objects.filter(
            user=request.user
        ).exists():

            return Response(
                {
                    "error":
                    "Resume already exists. Use PUT to update it."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # PDF → Text
        try:

            resume_text = extract_pdf_text(
                resume_file
            )

        except Exception as e:

            return Response(
                {
                    "error": "Could not read PDF",
                    "details": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not resume_text.strip():

            return Response(
                {
                    "error":
                    "No readable text found in PDF"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Text → Skills
        skills = extract_skills(
            resume_text
        )

        # Save
        resume = Resume.objects.create(
        user=request.user,
        file=resume_file,
        original_name=resume_file.name,
        extracted_text=resume_text,
        skills=skills
      )

        serializer = ResumeSerializer(resume)

        return Response(
            {
                "message":
                "Resume uploaded successfully",

                "resume":
                serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    # =========================
    # PUT - Update Resume
    # =========================

    def put(self, request):

        try:

            resume = Resume.objects.get(
                user=request.user
            )

        except Resume.DoesNotExist:

            return Response(
                {
                    "error":
                    "Resume not found. Upload resume first."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        resume_file = request.FILES.get(
            "resume"
        )

        # -------------------------
        # Update PDF
        # -------------------------

        if resume_file:

            if not resume_file.name.lower().endswith(".pdf"):

                return Response(
                    {
                        "error":
                        "Only PDF files are allowed"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:

                resume_text = extract_pdf_text(
                    resume_file
                )

            except Exception as e:

                return Response(
                    {
                        "error": "Could not read PDF",
                        "details": str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not resume_text.strip():

                return Response(
                    {
                        "error":
                        "No readable text found in PDF"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Extract skills again
            skills = extract_skills(
                resume_text
            )

            resume.file = resume_file
            resume.original_name = resume_file.name
            resume.extracted_text = resume_text
            resume.skills = skills

        # -------------------------
        # Update other fields
        # -------------------------

        if "job_title" in request.data:

            resume.job_title = request.data.get(
                "job_title"
            )

        if "education" in request.data:

            resume.education = request.data.get(
                "education"
            )

        if "experience_years" in request.data:

            resume.experience_years = request.data.get(
                "experience_years"
            )

        if "skills" in request.data and not resume_file:

            resume.skills = request.data.get(
                "skills"
            )

        resume.save()

        serializer = ResumeSerializer(
            resume
        )

        return Response(
            {
                "message":
                "Resume updated successfully",

                "resume":
                serializer.data
            },
            status=status.HTTP_200_OK
        )