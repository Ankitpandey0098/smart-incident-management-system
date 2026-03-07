from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static


from .views import (
    IncidentViewSet,
    contact_view,
    contact_list,
    ml_test,
    department_analytics,
    incident_category_stats,
    incident_status_stats,
    get_notifications,
    mark_notification_read,
    report_incident_to_department,
)
from .views_auth import (
    get_current_user,
    register_user,
    login_user,
    profile_view,
    get_csrf,
    forgot_password,
    verify_otp,
    reset_password,
)
from .views_auth import forgot_password, verify_otp, reset_password

# Router
router = DefaultRouter()
router.register(r"incidents", IncidentViewSet, basename="incident")

# URL Patterns
urlpatterns = [
    path("", include(router.urls)),

    # Auth
    path("register/", register_user),
    path("login/", login_user),
    path("csrf/", get_csrf),

    # Profile
    path("user/", get_current_user),
    path("profile/", profile_view),

    # ML
    path("ml-test/", ml_test),

    # Contact
    path("contact/", contact_view),
    path("contact-list/", contact_list),
    path("forgot-password/", forgot_password),
    path("verify-otp/", verify_otp),
    path("reset-password/", reset_password),
    # Analytics
    path("analytics/departments/", department_analytics, name="department-analytics"),
    path("analytics/category/", incident_category_stats, name="category-analytics"),
    path("analytics/status/", incident_status_stats, name="status-analytics"),

    # Notifications
    path('notifications/', get_notifications, name='get-notifications'),
    path('notifications/mark_read/', mark_notification_read, name='mark-notification-read'),
    path(
    "incidents/<int:id>/report/",
    report_incident_to_department,
    name="report-incident-to-department",

),
    # Password Reset
    path("auth/forgot-password/", forgot_password),
    path("auth/verify-otp/", verify_otp),
    path("auth/reset-password/", reset_password),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
