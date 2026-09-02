from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, LoginSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import JobSerializer
from rest_framework.generics import RetrieveAPIView, ListAPIView
from .models import Job
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import ApplyFormSerializer
from .models import Profile
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import ApplyForm
from .serializers import ApplyFormListSerializer
from .pagination import ApplyFormPagination
from django.contrib.auth import get_user_model
from .model.notification import Notification

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

class JobCreateAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = JobSerializer(data=request.data)

        if serializer.is_valid():

            # 1. Job create
            job = serializer.save(
    posted_by=request.user
)

            # 2. All users except job poster
            users = User.objects.exclude(
                id=request.user.id
            )

            # 3. Notifications prepare
            notifications = []

            for user in users:

                notifications.append(
                    Notification(
                        recipient=user,
                        notification_type="JOB_POSTED",
                        title="New Job Posted",
                        message=(
                            f"New job posted: "
                            f"{job.job_title} at "
                            f"{job.company_name}."
                        ),
                        job=job,
                        is_read=False
                    )
                )

            # 4. Save all notifications
            Notification.objects.bulk_create(
                notifications
            )

            return Response(
                {
                    "success": True,
                    "message": "Job created and notifications sent.",
                    "job": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class JobListAPIView(ListAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

class JobDetailAPIView(RetrieveAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

class ApplyFormAPIView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):

        serializer = ApplyFormSerializer(data=request.data)

        if serializer.is_valid():

            # 1. Application save
            application = serializer.save()

            # 2. Applied job
            job = application.job

            # 3. Job owner / recruiter
            recruiter = job.posted_by

            # 4. Send notification to recruiter
            if recruiter:
                Notification.objects.create(
    recipient=recruiter,
    notification_type="APPLICATION_SUBMITTED",
    title="New Application Received",
    message=(
        f"{application.full_name} applied for "
        f"{job.job_title}."
    ),
    application=application,   # IMPORTANT
    job=job,
    is_read=False
)
            return Response(
                {
                    "success": True,
                    "message": "Application Submitted Successfully"
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class ProfileAPIView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save(user=request.user)

            if created:
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request):
        profile = Profile.objects.get(user=request.user)

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class LogoutAPIView(APIView):

    permission_classes = [IsAuthenticated]
  
    def post(self, request):

        try:
            refresh_token = request.data.get("refresh")

            if not refresh_token:
                return Response(
                    {
                        "success": False,
                        "message": "Refresh token is required"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {
                    "success": True,
                    "message": "Logout Successfully"
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

class ApplyFormListAPIView(APIView):
    permission_classes = [IsAuthenticated]
   

    def get(self, request):

        queryset = ApplyForm.objects.filter(
            job__posted_by=request.user
        ).order_by("-created_at")

        search = request.GET.get("search")

        if search:
            queryset = queryset.filter(
    Q(full_name__icontains=search) |
    Q(email__icontains=search) |
    Q(phone__icontains=search) |
    Q(current_location__icontains=search) |
    Q(current_company__icontains=search) |
    Q(current_role__icontains=search)
)

        status = request.GET.get("status")

        if status:
            queryset = queryset.filter(status=status)

        paginator = ApplyFormPagination()

        result = paginator.paginate_queryset(queryset, request)

        serializer = ApplyFormListSerializer(
            result,
            many=True,
            context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)


class ApplicationStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
   
    def patch(self, request, pk):
        try:
            application = ApplyForm.objects.get(pk=pk)
        except ApplyForm.DoesNotExist:
            return Response(
                {"message": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        application.status = request.data.get("status", application.status)
        application.notes = request.data.get("notes", application.notes)
        application.save()

        return Response({
            "success": True,
            "message": "Application updated successfully"
        })