from django.db import models
from django.contrib.auth.models import User


class Candidate(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Job(models.Model):

    posted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posted_jobs",
        null=True,
        blank=True
    )

    job_title = models.CharField(max_length=200)
    job_category = models.CharField(max_length=100)
    job_type = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    salary_range = models.CharField(max_length=100)

    description = models.TextField()
    key_skills = models.TextField()
    min_qualification = models.CharField(max_length=200)
    experience_years = models.CharField(max_length=20)
    deadline = models.DateField(null=True, blank=True)
    openings = models.IntegerField()
    benefits = models.TextField(blank=True)
    company_name = models.CharField(max_length=200)

    logo = models.ImageField(
        upload_to="company_logos/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.job_title
    
class ApplyForm(models.Model):
    EXPERIENCE_CHOICES = [
        ("0-1 Years", "0-1 Years"),
        ("1-2 Years", "1-2 Years"),
        ("2-4 Years", "2-4 Years"),
        ("4-6 Years", "4-6 Years"),
        ("6+ Years", "6+ Years"),
    ]

    NOTICE_CHOICES = [
        ("Immediate", "Immediate"),
        ("15 Days", "15 Days"),
        ("30 Days", "30 Days"),
        ("60 Days", "60 Days"),
        ("90 Days", "90 Days"),
    ]
    
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Reviewed", "Reviewed"),
        ("Shortlisted", "Shortlisted"),
        ("Selected", "Selected"),
        ("Rejected", "Rejected"),
    ]

    job = models.ForeignKey(
        "Jobportal.Job",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    current_location = models.CharField(max_length=200)

    linkedin = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)

    total_experience = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    current_role = models.CharField(max_length=150, blank=True)
    current_company = models.CharField(max_length=150, blank=True)

    resume = models.FileField(upload_to="resumes/")
    cover_letter = models.TextField(blank=True)
    notice_period = models.CharField(max_length=20, choices=NOTICE_CHOICES)
    expected_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )
    interview_date = models.DateField(
    null=True,
    blank=True
    )

    interview_time = models.TimeField(
    null=True,
    blank=True
    )

    notes = models.TextField(
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ApplyForm"

    def __str__(self):
        return self.full_name


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    # =========================
    # Personal Information
    # =========================

    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=200)

    job_title = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    experience = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    about = models.TextField(
        blank=True,
        null=True
    )

    # =========================
    # Work Experience
    # =========================

    experience_company = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    experience_role = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    experience_start_date = models.DateField(
        blank=True,
        null=True
    )

    experience_end_date = models.DateField(
        blank=True,
        null=True
    )

    experience_description = models.TextField(
        blank=True,
        null=True
    )

    # =========================
    # Education
    # =========================

    degree = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    institution = models.CharField(
        max_length=250,
        blank=True,
        null=True
    )

    field_of_study = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    graduation_year = models.IntegerField(
        blank=True,
        null=True
    )

    cgpa = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    # =========================
    # Skills
    # =========================

    skills = models.TextField(
        blank=True,
        null=True
    )

    # =========================
    # Additional Information
    # =========================

    dob = models.DateField(
        blank=True,
        null=True
    )

    GENDER_CHOICES = (
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    )

    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        null=True
    )

    linkedin = models.URLField(
        blank=True,
        null=True
    )

    portfolio = models.URLField(
        blank=True,
        null=True
    )

    github = models.URLField(
        blank=True,
        null=True
    )

    current_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True
    )

    expected_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True
    )

    notice_period = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "myprofile"

    def __str__(self):
        return self.full_name