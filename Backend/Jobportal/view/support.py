from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..model.support import (
    SupportConversation,
    SupportMessage
)

from ..serializer.support import (
    SupportConversationSerializer,
    SupportMessageSerializer
)


# =========================================================
# 1. USER SEND SUPPORT MESSAGE
# =========================================================

class SendSupportMessageView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        subject = request.data.get("subject")
        message = request.data.get("message")
        attachment = request.FILES.get("attachment")

        if not subject:
            return Response(
                {"error": "Subject is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create conversation for logged-in user
        conversation = SupportConversation.objects.create(
            user=request.user,
            subject=subject
        )

        # Create first message
        support_message = SupportMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            sender_type="user",
            message=message,
            attachment=attachment
        )

        serializer = SupportConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


# =========================================================
# 2. USER GET HIS/HER OWN SUPPORT MESSAGES
# =========================================================

class MySupportMessagesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        messages = (
            SupportMessage.objects
            .filter(conversation__user=request.user)
            .select_related("sender", "conversation")
            .order_by("created_at")
        )

        serializer = SupportMessageSerializer(
            messages,
            many=True
        )

        return Response(serializer.data)


# =========================================================
# 3. RECRUITER / SUPPORT REPLY
# =========================================================

class SupportReplyView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):

        message = request.data.get("message")

        if not message:
            return Response(
                {"error": "Reply message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find original support message
        try:
            original_message = SupportMessage.objects.get(
                id=message_id
            )
        except SupportMessage.DoesNotExist:
            return Response(
                {"error": "Support message not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # Check recruiter/admin permission
        # -------------------------------------------------

        # If your User model has role field
        if getattr(request.user, "role", None) not in [
            "recruiter",
            "admin"
        ]:
            return Response(
                {"error": "Only recruiter or admin can reply"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create recruiter/support reply
        reply = SupportMessage.objects.create(
            conversation=original_message.conversation,
            sender=request.user,
            sender_type="support",
            message=message
        )

        # Update conversation time
        conversation = original_message.conversation
        conversation.save()

        serializer = SupportMessageSerializer(reply)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

# =========================================================
# 4. DELETE USER SUPPORT MESSAGE
# =========================================================

class SupportMessageDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):

        try:
            support_message = SupportMessage.objects.get(
                id=message_id,
                conversation__user=request.user,
                sender=request.user,
                sender_type="user"
            )

        except SupportMessage.DoesNotExist:
            return Response(
                {
                    "error": "Message not found or you do not have permission to delete it."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete message from database
        support_message.delete()

        return Response(
            {
                "message": "Support message deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT
        )