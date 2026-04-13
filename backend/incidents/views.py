from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.contrib.auth.models import User
from django.db.models import Count
from django.db.models.functions import TruncDate

from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

from .ml.predict import predict_category
from .models import Incident, IncidentLog, ContactMessage, UserProfile, Notification, Department
from .serializers import IncidentSerializer, ContactMessageSerializer, NotificationSerializer
from incidents.models import Incident
from django.utils import timezone

# ================= CATEGORY → DEPARTMENT MAP =================
CATEGORY_DEPARTMENT_MAP = {
    "Drainage Issue": "Water Management",
    "Illegal Dumping": "Waste Management",
    "Deforestation": "Forest",
    "Illegal Wood Smuggling": "Forest",
    "Pollution": "Pollution",
    "Environmental Damage": "Pollution",

    "Infrastructure": "Traffic / Roads",   # ADD THIS
    "Road Damage": "Traffic / Roads",

    "Animal Injury": "Wildlife / Animal Control",
    "Flood": "Disaster Management",
    "Fire": "Fire Department",
    "Power Outage": "Electricity Department",

    "Accident": "Emergency Services",
    "Medical Emergency": "Health Department",

    "Crime": "Police Department",
    "Cyber Crime": "Cyber Crime Cell",
}

# ================= INCIDENT VIEWSET =================
class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user

        # Admin sees all
        if user.is_staff:
            qs = Incident.objects.all()

        else:
            try:
                profile = user.userprofile

                # Department user
                if profile.role == "department":
                    qs = Incident.objects.filter(
                        department__iexact=profile.department
                    )

                # Normal citizen user
                else:
                    qs = Incident.objects.filter(user=user)

            except:
                qs = Incident.objects.filter(user=user)

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
            emergency = prediction.get("emergency", False)
            print("ML RESULT:", prediction)
        except Exception as e:
            print("ML ERROR:", e)
            category = None
            confidence = 0.0
            emergency = False

        if not category or confidence < 0.4:
            category = "General Issue"

        category_clean = str(category).strip().title()

        print("RAW CATEGORY:", category)
        print("CLEAN CATEGORY:", category_clean)

        # Department mapping
        department = CATEGORY_DEPARTMENT_MAP.get(category_clean, "Municipality")

        print("CATEGORY:", category_clean)


        print("DEPARTMENT MAP RESULT:", department)
        print("FINAL DEPARTMENT TO SAVE:", department)

        incident = serializer.save(
            user=self.request.user,
            category=category_clean,
            confidence=confidence,
            department=department,
            status="pending",
        )

        # Log creation
        IncidentLog.objects.create(
               incident=incident,
            action="Incident created",
            performed_by=self.request.user
        )

        # Email to user
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

        # ================= AI AUTO ESCALATION =================
        if emergency and not incident.reported_to_department:

            try:
                department_obj = Department.objects.get(name=incident.department)

                html_content = render_to_string(
                    "emails/incident_reported_to_department.html",
                    {
                        "department_name": department_obj.name,
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
                    subject=f"🚨 EMERGENCY Incident - {incident.title} (ID {incident.id})",
                    body="An emergency incident has been automatically escalated.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[department_obj.email],
                )

                email.attach_alternative(html_content, "text/html")
                email.send(fail_silently=False)

                incident.reported_to_department = True
                incident.save(update_fields=["reported_to_department"])

                IncidentLog.objects.create(
                    incident=incident,
                    action=f"AI automatically escalated incident to {department_obj.name} department",
                    performed_by=None
                )

            except Department.DoesNotExist:
                print("Department not found for auto escalation")

    def get_queryset(self):
        user = self.request.user

        # Admin sees all
        if user.is_staff:
            qs = Incident.objects.all()

        else:
            try:
                profile = user.userprofile

                # Department user
                if profile.role == "department":
                    qs = Incident.objects.filter(
                        department__iexact=profile.department
                    )

                # Normal citizen user
                else:
                    qs = Incident.objects.filter(user=user)

            except:
                qs = Incident.objects.filter(user=user)

        # ✅ Hide resolved incidents older than 8 days
        from django.utils import timezone
        from datetime import timedelta

        eight_days_ago = timezone.now() - timedelta(days=8)

        qs = qs.exclude(
            status="resolved",
            resolved_at__lt=eight_days_ago
        )

        return qs.order_by("-created_at")


    # ---------- DELETE ----------
    def destroy(self, request, *args, **kwargs):
        incident = self.get_object()
        if incident.user != request.user and not request.user.is_staff:
            return Response({"error": "Not allowed"}, status=403)

        incident.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ================= ADMIN MANUAL REPORT =================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_incident_to_department(request, id):

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
# ================= REPORT INCIDENT TO DEPARTMENT =================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_incident_to_department(request, id):

    if not request.user.is_staff:
        return Response(
            {"error": "Only admin can send email"},
            status=403
        )

    try:
        incident = Incident.objects.get(id=id)
    except Incident.DoesNotExist:
        return Response(
            {"error": "Incident not found"},
            status=404
        )

    if not incident.department:
        return Response(
            {"error": "No department assigned"},
            status=400
        )

    try:
        department = Department.objects.get(
            name=incident.department
        )
    except Department.DoesNotExist:
        return Response(
            {"error": "Department email not found"},
            status=404
        )

    # Optional admin message
    admin_message = request.data.get("message", "")

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
            "admin_message": admin_message,
        }
    )

    email = EmailMultiAlternatives(
        subject=f"Incident Update - {incident.title} (ID {incident.id})",
        body="Incident update from admin",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[department.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

    # ✅ Update tracking
    incident.reported_to_department = True
    incident.reported_at = timezone.now()
    incident.email_sent_count += 1
    incident.last_email_sent_at = timezone.now()

    incident.save(
        update_fields=[
            "reported_to_department",
            "reported_at",
            "email_sent_count",
            "last_email_sent_at"
        ]
    )

    # Log
    IncidentLog.objects.create(
        incident=incident,
        action=f"Admin sent email to {department.name} (Attempt #{incident.email_sent_count})",
        performed_by=request.user
    )

    return Response({
        "message": "Email sent successfully",
        "sent_count": incident.email_sent_count
    })

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

# ================= INCIDENT TIMELINE ANALYTICS =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incident_timeline(request):
    qs = Incident.objects.all() if request.user.is_staff else Incident.objects.filter(user=request.user)

    data = (
        qs.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    result = [
        {
            "date": item["date"].strftime("%d %b"),
            "count": item["count"],
        }
        for item in data
    ]

    return Response(result)
# ================= AI RISK ALERTS =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def risk_alerts(request):

    qs = Incident.objects.all()

    data = (
        qs.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    alerts = []

    for item in data:
        if item["count"] >= 3:   # threshold

            alerts.append({
                "category": item["category"],
                "count": item["count"],
                "message": f"{item['category']} incidents increasing ({item['count']})"
            })

    return Response(alerts)

# ================= LOCATION HOTSPOT DETECTION =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def location_risk_alerts(request):

    qs = Incident.objects.all()

    data = (
        qs.values("location")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    alerts = []

    for item in data:
        if item["count"] >= 3 and item["location"]:
            alerts.append({
                "location": item["location"],
                "count": item["count"],
                "message": f"High incident activity detected in {item['location']}"
            })

    return Response(alerts)

# ================= INCIDENT HEATMAP DATA =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incident_heatmap(request):

    qs = Incident.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True)

    data = qs.values("latitude", "longitude")

    heatmap = []

    for item in data:
        heatmap.append({
            "lat": item["latitude"],
            "lng": item["longitude"]
        })

    return Response(heatmap)

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

# ================= STATUS UPDATE FROM EMAIL =================
@api_view(["GET"])
@permission_classes([AllowAny])
def update_incident_status_from_email(request, incident_id, new_status):

    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        return Response({"error": "Incident not found"}, status=404)

    old_status = incident.status
    incident.status = new_status
    incident.save(update_fields=["status"])

    # Log action
    IncidentLog.objects.create(
        incident=incident,
        action=f"Status changed from '{old_status}' to '{new_status}' via department email",
        performed_by=None
    )

    # Notification for user
    Notification.objects.create(
        user=incident.user,
        incident=incident,
        message=f"Status of your incident '{incident.title}' updated to '{new_status}'."
    )

    # Email to user
    if incident.user.email:

        html_content = render_to_string(
            "emails/incident_status_updated.html",
            {
                "username": incident.user.username,
                "title": incident.title,
                "status": incident.status,
                "department": incident.department,
                "incident_id": incident.id,
            }
        )

        email = EmailMultiAlternatives(
            subject=f"Update on your incident '{incident.title}'",
            body=f"Status updated to {incident.status}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[incident.user.email],
        )

        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=True)

    return Response({"message": f"Incident status updated to {new_status}"})
