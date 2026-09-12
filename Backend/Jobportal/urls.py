from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    LoginView,
    LogoutAPIView,
    JobCreateAPIView,
    JobListAPIView,
    JobDetailAPIView,
    ApplyFormAPIView,
    ProfileAPIView,
    ApplyFormListAPIView,
    ApplicationStatusUpdateAPIView,
    DeleteAccountAPIView,
    ChangePasswordAPIView,
    GoogleLoginAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
)

from rest_framework_simplejwt.views import TokenRefreshView

from .export_views import ExportApplicationExcelAPIView
from .view.user_application_views import MyApplicationsAPIView
from .view.notifications import NotificationViewSet
from .view.DashboardStatsAPIView import DashboardStatsAPIView
from .view.resume import (
    ResumeAnalyzeView,
    ResumeGenerateView,
    GeneratedResumeListView,
    GeneratedResumeDetailView,
    GeneratedResumeDownloadView,
)

from .view.support import (
    SendSupportMessageView,
    MySupportMessagesView,
    SupportReplyView,
    SupportMessageDetailView,
)

from .view.savejob import (
    SaveJobAPIView,
    UnsaveJobAPIView,
    SavedJobListAPIView,
)


# Notification Router
router = DefaultRouter()

router.register(
    r"notifications",
    NotificationViewSet,
    basename="notifications"
)


urlpatterns = [

    # =========================
    # AUTH
    # =========================

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    path(
        "google-login/",
        GoogleLoginAPIView.as_view(),
        name="google-login"
    ),

    path(
        "change-password/",
        ChangePasswordAPIView.as_view(),
        name="change-password"
    ),

    path(
        "delete-account/",
        DeleteAccountAPIView.as_view(),
        name="delete-account"
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh"
    ),

    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout"
    ),


    # =========================
    # JOBS
    # =========================

    path(
        "jobs/create/",
        JobCreateAPIView.as_view(),
        name="job-create"
    ),

    path(
        "jobs/",
        JobListAPIView.as_view(),
        name="jobs"
    ),

    path(
        "jobs/<int:pk>/",
        JobDetailAPIView.as_view(),
        name="job-detail"
    ),


    # =========================
    # APPLICATION
    # =========================

    path(
        "apply/",
        ApplyFormAPIView.as_view(),
        name="apply-form"
    ),

    path(
        "profile/",
        ProfileAPIView.as_view(),
        name="profile"
    ),

    path(
        "admin/applications/",
        ApplyFormListAPIView.as_view(),
        name="application-list"
    ),

    path(
        "applications/export-excel/",
        ExportApplicationExcelAPIView.as_view(),
        name="export-excel"
    ),

    path(
        "admin/applications/<int:pk>/",
        ApplicationStatusUpdateAPIView.as_view(),
        name="application-update"
    ),

    path(
        "my-applications/",
        MyApplicationsAPIView.as_view(),
        name="my-applications"
    ),


    # =========================
    # NOTIFICATIONS
    # =========================

    path(
        "",
        include(router.urls)
    ),


    # =========================
    # RESUME
    # =========================

    path(
        "resume/analyze/",
        ResumeAnalyzeView.as_view(),
        name="resume-analyze"
    ),

    path(
        "resume/generate/",
        ResumeGenerateView.as_view(),
        name="resume-generate"
    ),

    path(
        "resume/generated/",
        GeneratedResumeListView.as_view(),
        name="generated-resume-list"
    ),

    path(
        "resume/generated/<int:pk>/",
        GeneratedResumeDetailView.as_view(),
        name="generated-resume-detail"
    ),

    path(
        "resume/generated/<int:pk>/download/",
        GeneratedResumeDownloadView.as_view(),
        name="generated-resume-download"
    ),


    # =========================
    # SUPPORT
    # =========================

    path(
        "support/messages/",
        SendSupportMessageView.as_view(),
        name="send-support-message"
    ),

    path(
        "support/my-messages/",
        MySupportMessagesView.as_view(),
        name="my-support-messages"
    ),

    path(
        "support/messages/<int:message_id>/",
        SupportMessageDetailView.as_view(),
        name="support-message-detail"
    ),

    path(
        "support/messages/<int:message_id>/reply/",
        SupportReplyView.as_view(),
        name="support-reply"
    ),


    # =========================
    # SAVED JOBS
    # =========================

    # Save Job
    path(
        "jobs/<int:job_id>/save/",
        SaveJobAPIView.as_view(),
        name="save-job"
    ),

    # Unsave Job
    path(
        "jobs/<int:job_id>/unsave/",
        UnsaveJobAPIView.as_view(),
        name="unsave-job"
    ),

    # Get all saved jobs
    path(
        "saved-jobs/",
        SavedJobListAPIView.as_view(),
        name="saved-jobs"
    ),

    path(
    "dashboard/stats/",
    DashboardStatsAPIView.as_view(),
    name="dashboard-stats"
),

     path(
        "forgot-password/",
        ForgotPasswordAPIView.as_view(),
        name="forgot-password"
    ),

    path(
        "reset-password/",
        ResetPasswordAPIView.as_view(),
        name="reset-password"
    ),
]