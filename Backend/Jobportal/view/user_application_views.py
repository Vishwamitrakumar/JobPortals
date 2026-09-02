from datetime import datetime

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone

from ..models import ApplyForm
from ..serializers import ApplyFormListSerializer


class MyApplicationsPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 100


class MyApplicationsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = MyApplicationsPagination

    def get(self, request):
        applications = ApplyForm.objects.filter(
            email=request.user.email
        ).select_related("job").order_by("-created_at")  # descending — latest first

        # ---- status filter ----
        status_param = request.query_params.get("status")
        if status_param and status_param.lower() != "all status":
            applications = applications.filter(status__iexact=status_param)

        # ---- search filter (name / email / company) ----
        search = request.query_params.get("search")
        if search:
            applications = applications.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(current_company__icontains=search)
            )

        # ---- date range filter (thisMonth / previousMonth / thisYear / all) ----
        date_range = request.query_params.get("range")

        if date_range and date_range != "all":
            now = timezone.localtime(timezone.now())

            if date_range == "thisMonth":
                start = now.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                end = None  # open-ended, up to now

            elif date_range == "previousMonth":
                first_of_this_month = now.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                # last microsecond of previous month is one tick before this month starts
                end = first_of_this_month
                # first day of previous month
                prev_month = first_of_this_month.month - 1 or 12
                prev_year = first_of_this_month.year - (
                    1 if first_of_this_month.month == 1 else 0
                )
                start = first_of_this_month.replace(
                    year=prev_year, month=prev_month, day=1
                )

            elif date_range == "thisYear":
                start = now.replace(
                    month=1, day=1, hour=0, minute=0, second=0, microsecond=0
                )
                end = None

            else:
                start = None
                end = None

            if start:
                applications = applications.filter(created_at__gte=start)

            if end:
                applications = applications.filter(created_at__lt=end)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(applications, request, view=self)

        serializer = ApplyFormListSerializer(
            page,
            many=True,
            context={"request": request}
        )

        return Response({
            "success": True,
            "count": paginator.page.paginator.count,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "applications": serializer.data,
        })