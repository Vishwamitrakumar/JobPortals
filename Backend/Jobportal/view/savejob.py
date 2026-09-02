from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..models import Job
from ..model.savejob import SavedJob
from ..serializer.SavedJobList import SavedJobSerializer

class SaveJobAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Job not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        saved_job, created = SavedJob.objects.get_or_create(
            user=request.user,
            job=job
        )

        return Response(
            {
                "success": True,
                "saved": True,
                "message": "Job saved successfully"
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class UnsaveJobAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):

        deleted, _ = SavedJob.objects.filter(
            user=request.user,
            job_id=job_id
        ).delete()

        return Response(
            {
                "success": True,
                "saved": False,
                "message": (
                    "Job removed from saved jobs"
                    if deleted
                    else "Job was not saved"
                )
            },
            status=status.HTTP_200_OK
        )


class SavedJobListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        saved_jobs = (
            SavedJob.objects
            .filter(user=request.user)
            .select_related("job")
            .order_by("-created_at")
        )

        serializer = SavedJobSerializer(
            saved_jobs,
            many=True
        )

        return Response(
            {
                "success": True,
                "count": saved_jobs.count(),
                "jobs": serializer.data
            },
            status=status.HTTP_200_OK
        )