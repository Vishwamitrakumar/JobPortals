from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


from ..models import ApplyForm
from ..serializers import ApplyFormListSerializer


class MyApplicationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        applications = ApplyForm.objects.filter(
            email=request.user.email
        ).select_related("job").order_by("-created_at")

        serializer = ApplyFormListSerializer(
            applications,
            many=True,
            context={"request": request}
        )

        return Response({
            "success": True,
            "applications": serializer.data
        })