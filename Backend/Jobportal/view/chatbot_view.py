from collections import Counter

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from Jobportal.serializer.chatbot_serializer import ChatbotSerializer

from Jobportal.model.chatbot import (
    ChatConversation,
    ChatMessage,
)

from Jobportal.chatbot.intent import detect_intent

from Jobportal.chatbot.utils import (
    extract_job_keyword,
)

from Jobportal.chatbot.database_service import (
    search_jobs,
    get_user_profile,
    get_user_applications,
)

from Jobportal.chatbot.rag_service import (
    answer_from_rag,
)

from Jobportal.chatbot.llm_service import (
    generate_answer,
)


class ChatbotAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        # ==========================================
        # VALIDATE REQUEST
        # ==========================================

        serializer = ChatbotSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "message": "Message is required.",
                    "errors": serializer.errors,
                },
                status=400,
            )

        message = serializer.validated_data[
            "message"
        ].strip()

        user = request.user

        # ==========================================
        # GET / CREATE CONVERSATION
        # ==========================================

        conversation, created = (
            ChatConversation.objects.get_or_create(
                user=user
            )
        )

        # ==========================================
        # SAVE USER MESSAGE
        # ==========================================

        ChatMessage.objects.create(
            conversation=conversation,
            role="user",
            content=message,
        )

        # ==========================================
        # DETECT INTENT
        # ==========================================

        intent = detect_intent(
            message
        )

        # ==========================================
        # PROCESS REQUEST
        # ==========================================

        if intent == "JOB_SEARCH":

            reply = self.handle_job_search(
                message
            )

        elif intent == "APPLICATION_STATUS":

            reply = self.handle_application_status(
                user,
                message
            )

        elif intent == "PROFILE":

            reply = self.handle_profile(
                user,
                message
            )

        elif intent == "JOB_RECOMMENDATION":

            reply = self.handle_job_recommendation(
                user,
                message
            )

        elif intent == "INTERVIEW":

            reply = answer_from_rag(
                message
            )

        elif intent == "GENERAL":

            reply = (
                "Hi! 👋 I'm JobPortal AI. "
                "I can help you with jobs, applications, "
                "interviews, profiles, job status, "
                "and career questions."
            )

        else:

            reply = answer_from_rag(
                message
            )

        # ==========================================
        # SAVE ASSISTANT MESSAGE
        # ==========================================

        ChatMessage.objects.create(
            conversation=conversation,
            role="assistant",
            content=reply,
        )

        # ==========================================
        # RESPONSE
        # ==========================================

        return Response(
            {
                "success": True,
                "reply": reply,
                "intent": intent,
            }
        )

    # ==================================================
    # JOB SEARCH
    # ==================================================

    def handle_job_search(
        self,
        message
    ):

        keyword = extract_job_keyword(
            message
        )

        if not keyword:

            return (
                "Please mention a job skill or "
                "technology, for example Python, "
                "Django, Java or React."
            )

        jobs = search_jobs(
            keyword
        )

        if not jobs:

            return (
                "Sorry, I couldn't find "
                "matching jobs."
            )

        context = []

        for job in jobs:

            context.append(
                f"""
Job Title: {job.job_title}
Company: {job.company_name}
"""
            )

        context = "\n".join(
            context
        )

        return generate_answer(
            message,
            context
        )

    # ==================================================
    # APPLICATION STATUS
    # ==================================================

    def handle_application_status(
        self,
        user,
        message
    ):

        applications = get_user_applications(
            user
        )

        if not applications:

            return (
                "You have not submitted any "
                "job applications yet."
            )

        # ==========================================
        # COUNT ALL STATUSES
        # ==========================================

        status_counter = Counter()

        for application in applications:

            status = getattr(
                application,
                "status",
                None
            )

            if status:

                status_counter[
                    status.strip().lower()
                ] += 1

        # ==========================================
        # SPECIFIC STATUS COUNTS
        # ==========================================

        shortlisted_count = (
            status_counter.get(
                "shortlisted",
                0
            )
        )

        interview_count = (
            status_counter.get(
                "interview",
                0
            )
        )

        rejected_count = (
            status_counter.get(
                "rejected",
                0
            )
        )

        pending_count = (
            status_counter.get(
                "pending",
                0
            )
        )

        # ==========================================
        # BUILD APPLICATION DETAILS
        # ==========================================

        application_details = []

        for application in applications:

            job = getattr(
                application,
                "job",
                None
            )

            if job:

                job_title = getattr(
                    job,
                    "job_title",
                    "Unknown Job"
                )

                company_name = getattr(
                    job,
                    "company_name",
                    "Unknown Company"
                )

            else:

                job_title = "Unknown Job"
                company_name = "Unknown Company"

            status = getattr(
                application,
                "status",
                "Unknown"
            )

            application_details.append(
                f"""
Job: {job_title}
Company: {company_name}
Status: {status}
"""
            )

        # ==========================================
        # SUMMARY
        # ==========================================

        summary = f"""
APPLICATION SUMMARY

Total Applications:
{len(applications)}

Shortlisted:
{shortlisted_count}

Interview:
{interview_count}

Rejected:
{rejected_count}

Pending:
{pending_count}


APPLICATION DETAILS

{"".join(application_details)}
"""

        # ==========================================
        # RETURN DIRECTLY
        # ==========================================

        return summary

    # ==================================================
    # PROFILE
    # ==================================================

    def handle_profile(
        self,
        user,
        message
    ):

        profile = get_user_profile(
            user
        )

        if not profile:

            return (
                "I couldn't find your profile "
                "information."
            )

        # getattr prevents AttributeError if
        # a profile field is missing.

        full_name = getattr(
            profile,
            "full_name",
            ""
        )

        job_title = getattr(
            profile,
            "job_title",
            ""
        )

        experience = getattr(
            profile,
            "experience",
            ""
        )

        skills = getattr(
            profile,
            "skills",
            ""
        )

        about = getattr(
            profile,
            "about",
            ""
        )

        degree = getattr(
            profile,
            "degree",
            ""
        )

        institution = getattr(
            profile,
            "institution",
            ""
        )

        phone = getattr(
            profile,
            "phone",
            ""
        )

        location = getattr(
            profile,
            "location",
            ""
        )

        context = f"""
USER PROFILE

Name:
{full_name}

Email:
{getattr(profile, "email", user.email)}

Phone:
{phone}

Location:
{location}

Job Title:
{job_title}

Experience:
{experience}

Skills:
{skills}

About:
{about}

Education:
{degree}

Institution:
{institution}
"""

        return generate_answer(
            message,
            context
        )

    # ==================================================
    # JOB RECOMMENDATION
    # ==================================================

    def handle_job_recommendation(
        self,
        user,
        message
    ):

        profile = get_user_profile(
            user
        )

        if not profile:

            return (
                "Please complete your profile "
                "before asking for job recommendations."
            )

        jobs = search_jobs()

        if not jobs:

            return (
                "Sorry, I couldn't find "
                "available jobs."
            )

        context = f"""
USER PROFILE

Job Title:
{getattr(profile, "job_title", "")}

Experience:
{getattr(profile, "experience", "")}

Skills:
{getattr(profile, "skills", "")}

ABOUT:
{getattr(profile, "about", "")}


AVAILABLE JOBS
"""

        for job in jobs:

            context += f"""

Job Title:
{job.job_title}

Company:
{job.company_name}
"""

        return generate_answer(
            message,
            context
        )