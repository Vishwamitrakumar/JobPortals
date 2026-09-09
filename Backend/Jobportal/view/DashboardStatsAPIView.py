from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import ApplyForm
from ..model.savejob import SavedJob


class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        # Applications
        applications = ApplyForm.objects.filter(
            email=user.email
        )

        applications_count = applications.count()

        # Interviews
        interviews_count = applications.filter(
            status__iexact="interview"
        ).count()

        # Saved Jobs
        saved_jobs_count = SavedJob.objects.filter(
            user=user
        ).count()

        # Shortlisted
        shortlisted_count = applications.filter(
            status__iexact="shortlisted"
        ).count()

        return Response(
            {
                "success": True,
                "stats": {
                    "applications": applications_count,
                    "interviews": interviews_count,
                    "saved_jobs": saved_jobs_count,
                    "shortlisted": shortlisted_count,
                }
            },
            status=status.HTTP_200_OK
        )