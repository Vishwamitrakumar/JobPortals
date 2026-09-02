from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..model.notification import Notification
from ..serializer.notification import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Sirf logged-in user ki notifications return hongi.
        """

        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related(
            "job",
            "application"
        )

    def perform_create(self, serializer):
        """
        Notification create karte time recipient
        automatically logged-in user hoga.
        """

        serializer.save(
            recipient=self.request.user
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count"
    )
    def unread_count(self, request):

        count = self.get_queryset().filter(
            is_read=False
        ).count()

        return Response({
            "unread_count": count
        })

    @action(
        detail=True,
        methods=["patch"],
        url_path="read"
    )
    def mark_as_read(self, request, pk=None):

        notification = self.get_object()

        notification.is_read = True
        notification.save(
            update_fields=["is_read"]
        )

        return Response({
            "message": "Notification marked as read.",
            "is_read": True
        })

    @action(
        detail=False,
        methods=["patch"],
        url_path="read-all"
    )
    def mark_all_as_read(self, request):

        updated_count = self.get_queryset().filter(
            is_read=False
        ).update(
            is_read=True
        )

        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count
        })

    def destroy(self, request, *args, **kwargs):

        notification = self.get_object()

        notification.delete()

        return Response(
            {
                "message": "Notification deleted successfully."
            },
            status=status.HTTP_200_OK
        )