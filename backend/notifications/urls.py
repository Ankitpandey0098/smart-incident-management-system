from django.urls import path
from .views import get_notifications, mark_as_read

urlpatterns = [
    path("", get_notifications),
    path("read/<int:pk>/", mark_as_read),
]
