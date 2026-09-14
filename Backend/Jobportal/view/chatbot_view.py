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
                user
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
        user
    ):

        applications = get_user_applications(
            user
        )

        if not applications:

            return (
                "I couldn't find any applications "
                "associated with your account."
            )

        context = []

        for application in applications:

            context.append(
                f"""
Job: {application.job.job_title}
Company: {application.job.company_name}
Status: {application.status}
"""
            )

        return generate_answer(
            "Tell the user about their application status.",
            "\n".join(context)
        )

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

        context = f"""
Name:
{profile.full_name}

Job Title:
{profile.job_title}

Experience:
{profile.experience}

Skills:
{profile.skills}

About:
{profile.about}

Education:
{profile.degree}

Institution:
{profile.institution}
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
{profile.job_title}

Experience:
{profile.experience}

Skills:
{profile.skills}

ABOUT:
{profile.about}


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