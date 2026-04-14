from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from django.conf import settings
from django.conf.urls.static import static
# ---------------- Auth Imports ----------------
from incidents.views_auth import (
    get_current_user,
    register_user,
)

# ---------------- Analytics Imports ----------------
from incidents.views import (
    incident_category_stats,
    incident_status_stats,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # JWT Auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Register & Current User
    path("api/register/", register_user, name="register_user"),
    path("api/user/", get_current_user, name="current_user"),

    # Include Incidents & Contact API
    path("api/", include("incidents.urls")),

    # Analytics
    path("api/analytics/category/", incident_category_stats, name="incident_category_stats"),
    path("api/analytics/status/", incident_status_stats, name="incident_status_stats"),
    
]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)