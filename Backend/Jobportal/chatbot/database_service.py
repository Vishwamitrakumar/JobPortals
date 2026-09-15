from Jobportal.models import Job, Profile, ApplyForm


def search_jobs(keyword=None):

    queryset = Job.objects.all()

    if keyword:
        queryset = queryset.filter(
            job_title__icontains=keyword
        )

    return queryset[:10]


def get_user_profile(user):

    profile, created = Profile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": (
                f"{user.first_name} {user.last_name}"
            ).strip(),

            "email": user.email,

            "phone": "",

            "location": "",
        }
    )

    return profile


def get_user_applications(user):

    # Your current ApplyForm stores applicant email.
    return ApplyForm.objects.filter(
        email__iexact=user.email
    ).order_by("-created_at")[:10]