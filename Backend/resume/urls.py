from django.urls import path

from .views import ResumeAPIView


urlpatterns = [
    path(
        "resume-upload/",
        ResumeAPIView.as_view(),
        name="resume-upload"
    ),
]