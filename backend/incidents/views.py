from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.contrib.auth.models import User
from django.db.models import Count
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

from .ml.predict import predict_category
from .models import Incident, IncidentLog, ContactMessage, UserProfile, Notification, Department
from .serializers import IncidentSerializer, ContactMessageSerializer, NotificationSerializer


# ================= CATEGORY → DEPARTMENT MAP =================
CATEGORY_DEPARTMENT_MAP = {
    "Drainage Issue": "Water Management",
    "Illegal Dumping": "Waste Management",
    "Deforestation": "Forest",
    "Illegal Wood Smuggling": "Forest",
    "Pollution": "Pollution",
    "Environmental Damage": "Pollution",
    "Road Damage": "Traffic / Roads",
    "Public Health Hazard": "Public Health",
    "Animal Injury": "Wildlife / Animal Control",
}


# ================= INCIDENT VIEWSET =================
class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        qs = Incident.objects.all() if self.request.user.is_staff else Incident.objects.filter(user=self.request.user)
        return qs.order_by("-created_at")

    # ---------- CREATE ----------
    def perform_create(self, serializer):
        title = self.request.data.get("title", "")
        description = self.request.data.get("description", "")
        text = f"{title} {description}".strip()

        # ML prediction
        try:
            prediction = predict_category(text)
            category = prediction.get("category")
            confidence = float(prediction.get("confidence", 0.0))
        except Exception as e:
            print("ML ERROR:", e)
            category = None
            confidence = 0.0

        if not category or confidence < 0.4:
            category = "General Issue"

        department = CATEGORY_DEPARTMENT_MAP.get(category, "Municipality")

        incident = serializer.save(
            user=self.request.user,
            category=category,
            confidence=confidence,
            department=department,
            status="pending",
        )

        IncidentLog.objects.create(
            incident=incident,
            action="Incident created",
            performed_by=self.request.user
        )

        if incident.user.email:
            html_content = render_to_string(
                "emails/incident_created.html",
                {
                    "username": incident.user.username,
                    "title": incident.title,
                    "status": incident.status,
                    "incident_id": incident.id,
                    "logo_url": "https://raw.githubusercontent.com/ankitpandey0098/incident-assets/main/incident-logo.png"
                }
            )
            email = EmailMultiAlternatives(
                subject="Incident Reported Successfully",
                body="Your incident has been reported successfully.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[incident.user.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=True)

    # ---------- UPDATE ----------
    def partial_update(self, request, *args, **kwargs):
        incident = self.get_object()
        data = request.data.copy()

        if not request.user.is_staff:
            data.pop("status", None)
            data.pop("category", None)

        old_status = incident.status
        old_category = incident.category
        old_department = incident.department

        serializer = self.get_serializer(incident, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        incident.refresh_from_db()

        # Status change
        if old_status != incident.status:
            IncidentLog.objects.create(
                incident=incident,
                action=f"Status changed to '{incident.status}'",
                performed_by=request.user
            )
            Notification.objects.create(
                user=incident.user,
                incident=incident,
                message=f"Status of your incident '{incident.title}' changed to '{incident.status}'."
            )

        # Category → Department reassign
        if old_category != incident.category:
            new_department = CATEGORY_DEPARTMENT_MAP.get(
                incident.category,
                "Municipality"
            )

            if new_department != old_department:
                incident.department = new_department
                incident.save(update_fields=["department"])

            IncidentLog.objects.create(
                incident=incident,
                action=f"Category changed to '{incident.category}'",
                performed_by=request.user
            )

            Notification.objects.create(
                user=incident.user,
                incident=incident,
                message=(
                    f"Category changed to '{incident.category}'. "
                    f"Assigned department: {incident.department}."
                )
            )

        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------- DELETE ----------
    def destroy(self, request, *args, **kwargs):
        incident = self.get_object()
        if incident.user != request.user and not request.user.is_staff:
            return Response({"error": "Not allowed"}, status=403)

        incident.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ================= REPORT INCIDENT TO DEPARTMENT (NEW) =================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_incident_to_department(request, id):
    """
    Admin reports an incident to its assigned department via email
    """

    if not request.user.is_staff:
        return Response({"error": "Only admin can report incidents"}, status=403)

    try:
        incident = Incident.objects.get(id=id)
    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)
    if incident.reported_to_department:
        return Response(
            {"error": "Incident already reported to department"},
            status=400
        )

    if not incident.department:
        return Response({"error": "Incident has no department"}, status=400)

    try:
        department = Department.objects.get(name=incident.department)
    except Department.DoesNotExist:
        return Response({"error": "Department email not found"}, status=404)

    html_content = render_to_string(
        "emails/incident_reported_to_department.html",
        {
            "department_name": department.name,
            "incident_id": incident.id,
            "title": incident.title,
            "category": incident.category,
            "status": incident.status,
            "reported_by": incident.user.username if incident.user else "Anonymous",
            "created_at": incident.created_at.strftime("%d %b %Y, %I:%M %p"),
            "description": incident.description,
        }
    )

    email = EmailMultiAlternatives(
        subject=f"Incident Report - {incident.title} (ID {incident.id})",
        body="A new incident has been assigned to your department.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[department.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)
    incident.reported_to_department = True
    incident.save(update_fields=["reported_to_department"])


    IncidentLog.objects.create(
        incident=incident,
        action=f"Incident reported to {department.name} department via email",
        performed_by=request.user
    )
    


    return Response(
        {"message": f"Incident reported to {department.name} department"},
        status=200
    )
# ================= ANALYTICS =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incident_category_stats(request):
    qs = Incident.objects.all() if request.user.is_staff else Incident.objects.filter(user=request.user)
    data = qs.exclude(category__isnull=True).values("category").annotate(count=Count("id"))
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incident_status_stats(request):
    qs = Incident.objects.all() if request.user.is_staff else Incident.objects.filter(user=request.user)
    data = qs.values("status").annotate(count=Count("id"))
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def department_analytics(request):
    qs = Incident.objects.all() if request.user.is_staff else Incident.objects.filter(user=request.user)
    data = qs.exclude(department__isnull=True).values("department").annotate(count=Count("id"))
    return Response(data)


# ================= ML TEST =================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ml_test(request):
    description = request.data.get("description")
    if not description:
        return Response({"error": "Description required"}, status=400)

    prediction = predict_category(description)
    return Response(prediction)


# ================= CONTACT =================
@api_view(["POST"])
@permission_classes([AllowAny])
def contact_view(request):
    serializer = ContactMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"message": "Message received"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contact_list(request):
    messages = ContactMessage.objects.all().order_by("-created_at")
    serializer = ContactMessageSerializer(messages, many=True)
    return Response(serializer.data)


# ================= PROFILE =================
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response({
            "full_name": profile.full_name or "",
            "phone": profile.phone,
            "city": profile.city,
            "role": profile.role,
        })

    profile.full_name = request.data.get("full_name", profile.full_name)
    profile.phone = request.data.get("phone", profile.phone)
    profile.city = request.data.get("city", profile.city)
    profile.role = request.data.get("role", profile.role)
    profile.save()

    return Response({"message": "Profile updated"})


# ================= NOTIFICATIONS =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by("-created_at")
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request):
    notification_id = request.data.get("notification_id")
    if not notification_id:
        return Response({"error": "notification_id required"}, status=400)

    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"message": "Notification marked as read"})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)
