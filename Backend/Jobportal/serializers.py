from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Job
from .models import ApplyForm
from .models import Profile
from rest_framework.pagination import PageNumberPagination

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
        }

        return data


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"


class JobSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "job_title",
            "company_name",
            "logo",
            "location",
            "job_type",
            "experience_level",
            "salary_range",
        ]

class ApplyFormSerializer(serializers.ModelSerializer):

    class Meta:
        model = ApplyForm
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = "__all__"


class ApplyFormListSerializer(serializers.ModelSerializer):
    resume = serializers.SerializerMethodField()

    company_name = serializers.CharField(
        source="job.company_name",
        read_only=True
    )

    job_title = serializers.CharField(
        source="job.job_title",
        read_only=True
    )

    class Meta:
        model = ApplyForm
        fields = "__all__"

    def get_resume(self, obj):
        request = self.context.get("request")

        if obj.resume:
            return request.build_absolute_uri(obj.resume.url)

        return None

