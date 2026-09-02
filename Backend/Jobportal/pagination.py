from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny

class ApplyFormPagination(PageNumberPagination):
    permission_classes = [AllowAny]
    page_size = 10
    page_size_query_param = "page_size"