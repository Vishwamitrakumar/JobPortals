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
from rest_framework.parsers import MultiPartParser, FormParser
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
from django.contrib.auth.hashers import check_password
import requests
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.conf import settings


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # 1. Required fields check
        if not current_password:
            return Response(
                {
                    "success": False,
                    "message": "Current password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password:
            return Response(
                {
                    "success": False,
                    "message": "New password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "Confirm password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Check current password
        user = request.user

        if not user.check_password(current_password):
            return Response(
                {
                    "success": False,
                    "message": "Current password is incorrect."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Check new password and confirm password
        if new_password != confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "New password and confirm password do not match."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Prevent same old and new password
        if current_password == new_password:
            return Response(
                {
                    "success": False,
                    "message": "New password must be different from current password."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Set new password
        user.set_password(new_password)
        user.save()

        return Response(
            {
                "success": True,
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK
        )   

# ======================================================
# FORGOT PASSWORD
# ======================================================

class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")

        # 1. Check email
        if not email:
            return Response(
                {
                    "success": False,
                    "message": "Email is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        email = email.strip().lower()

        User = get_user_model()

        # 2. Check user exists
        try:
            user = User.objects.get(
                email__iexact=email
            )

        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "No account found with this email address."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # 3. Generate UID
        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        # 4. Generate secure token
        token = default_token_generator.make_token(user)

        # 5. Create reset link
        reset_link = (
            f"{settings.FRONTEND_URL}"
            f"/reset-password"
            f"?uid={uid}"
            f"&token={token}"
        )

        # 6. Send data to frontend
        # Frontend will use EmailJS
        return Response(
            {
                "success": True,
                "message": "Reset link generated successfully.",
                "email": user.email,
                "reset_link": reset_link
            },
            status=status.HTTP_200_OK
        )

# ======================================================
# RESET PASSWORD
# ======================================================

class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # 1. Required fields
        if not uid:
            return Response(
                {
                    "success": False,
                    "message": "Reset user ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not token:
            return Response(
                {
                    "success": False,
                    "message": "Reset token is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password:
            return Response(
                {
                    "success": False,
                    "message": "New password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "Confirm password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Password match
        if new_password != confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "New password and confirm password do not match."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Decode UID
        User = get_user_model()

        try:
            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {
                    "success": False,
                    "message": "Invalid password reset link."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Verify token
        if not default_token_generator.check_token(
            user,
            token
        ):
            return Response(
                {
                    "success": False,
                    "message": "This password reset link is invalid or expired."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Validate password
        try:
            validate_password(
                new_password,
                user
            )

        except ValidationError as error:
            return Response(
                {
                    "success": False,
                    "message": "Password validation failed.",
                    "errors": error.messages
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Update password
        user.set_password(new_password)
        user.save()

        # 7. Success
        return Response(
            {
                "success": True,
                "message": "Password reset successfully."
            },
            status=status.HTTP_200_OK
        )

class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        # 1. Google access token
        access_token = request.data.get("access_token")

        if not access_token:
            return Response(
                {
                    "success": False,
                    "error": "Google access token is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            # 2. Google se user information get karo
            google_response = requests.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={
                    "Authorization": f"Bearer {access_token}"
                },
                timeout=10
            )

            # 3. Token invalid hai
            if google_response.status_code != 200:
                return Response(
                    {
                        "success": False,
                        "error": "Invalid Google access token"
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            google_data = google_response.json()

            # 4. Google user information
            email = google_data.get("email")
            first_name = google_data.get("given_name", "")
            last_name = google_data.get("family_name", "")

            if not email:
                return Response(
                    {
                        "success": False,
                        "error": "Google email not found"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 5. Existing user check
            user = User.objects.filter(email=email).first()

            # 6. User nahi mila -> new user create
            if not user:

                user = User.objects.create_user(
                    username=email,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )

            # 7. Django JWT generate
            refresh = RefreshToken.for_user(user)

            # 8. Response
            return Response(
                {
                    "success": True,
                    "message": "Google Login Successful",

                    "access": str(refresh.access_token),
                    "refresh": str(refresh),

                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    }
                },
                status=status.HTTP_200_OK
            )

        except requests.RequestException:
            return Response(
                {
                    "success": False,
                    "error": "Unable to connect to Google"
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class DeleteAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user

        try:
            user.delete()

            return Response(
                {
                    "success": True,
                    "message": "Account deleted successfully"
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

    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):

        queryset = ApplyForm.objects.filter(
            job__posted_by=request.user
        ).order_by("-created_at")

        serializer = ApplyFormListSerializer(
            queryset,
            many=True,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

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
                    application=application,
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

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    # =========================================
    # GET PROFILE
    # =========================================

    def get(self, request):

        profile, created = Profile.objects.get_or_create(
            user=request.user,
            defaults={
                "full_name": (
                    f"{request.user.first_name} "
                    f"{request.user.last_name}"
                ).strip(),

                "email": request.user.email,

                "phone": "",

                "location": "",
            }
        )

        serializer = ProfileSerializer(profile)

        # =========================================
        # BASIC INFORMATION
        # =========================================

        basic_information = all([
            profile.full_name,
            profile.email,
            profile.phone,
            profile.location,
            profile.job_title,
            profile.experience,
            profile.about,
        ])

        # =========================================
        # WORK EXPERIENCE
        # =========================================

        work_experience = all([
            profile.experience_company,
            profile.experience_role,
            profile.experience_start_date,
            profile.experience_description,
        ])

        # =========================================
        # EDUCATION
        # =========================================

        education = all([
            profile.degree,
            profile.institution,
            profile.field_of_study,
            profile.graduation_year,
        ])

        # =========================================
        # SKILLS
        # =========================================

        skills = bool(
            profile.skills and profile.skills.strip()
        )

        # =========================================
        # PROFILE STRENGTH
        # =========================================

        completed_sections = sum([
            basic_information,
            work_experience,
            education,
            skills,
        ])

        profile_percentage = completed_sections * 25

        # =========================================
        # PROFILE STATUS
        # =========================================

        if profile_percentage == 100:
            profile_status = "Excellent"

        elif profile_percentage >= 75:
            profile_status = "Good"

        elif profile_percentage >= 50:
            profile_status = "Average"

        elif profile_percentage >= 25:
            profile_status = "Basic"

        else:
            profile_status = "Incomplete"

        # =========================================
        # FINAL RESPONSE
        # =========================================

        return Response(
            {
                "profile": serializer.data,

                "profile_strength": {
                    "percentage": profile_percentage,
                    "status": profile_status,

                    "sections": {
                        "basic_information": basic_information,
                        "work_experience": work_experience,
                        "education": education,
                        "skills": skills,
                    }
                }
            },
            status=status.HTTP_200_OK
        )

    # =========================================
    # POST / CREATE OR UPDATE PROFILE
    # =========================================

    def post(self, request):

        profile, created = Profile.objects.get_or_create(
            user=request.user,
            defaults={
                "full_name": (
                    f"{request.user.first_name} "
                    f"{request.user.last_name}"
                ).strip(),

                "email": request.user.email,

                "phone": "",

                "location": "",
            }
        )

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save(
                user=request.user
            )

            return Response(
                {
                    "success": True,
                    "message": (
                        "Profile created successfully"
                        if created
                        else "Profile updated successfully"
                    ),
                    "profile": serializer.data,
                },
                status=(
                    status.HTTP_201_CREATED
                    if created
                    else status.HTTP_200_OK
                )
            )

        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # =========================================
    # PUT / UPDATE PROFILE
    # =========================================

    def put(self, request):

        profile, _ = Profile.objects.get_or_create(
            user=request.user,
            defaults={
                "full_name": (
                    f"{request.user.first_name} "
                    f"{request.user.last_name}"
                ).strip(),

                "email": request.user.email,

                "phone": "",

                "location": "",
            }
        )

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save(
                user=request.user
            )

            return Response(
                {
                    "success": True,
                    "message": "Profile updated successfully",
                    "profile": serializer.data,
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
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

        new_status = request.data.get(
            "status",
            application.status
        )

        application.status = new_status

        # Notes
        application.notes = request.data.get(
            "notes",
            application.notes
        )

        # Interview Date & Time
        if new_status.lower() == "interview":

            interview_date = request.data.get("interview_date")
            interview_time = request.data.get("interview_time")

            if not interview_date or not interview_time:
                return Response(
                    {
                        "success": False,
                        "message": "Interview date and time are required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            application.interview_date = interview_date
            application.interview_time = interview_time

        else:
            application.interview_date = None
            application.interview_time = None

        application.save()

        return Response({
            "success": True,
            "message": "Application updated successfully",
            "data": {
                "status": application.status,
                "notes": application.notes,
                "interview_date": application.interview_date,
                "interview_time": application.interview_time
            }
        })