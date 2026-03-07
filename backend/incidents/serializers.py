from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Incident, IncidentLog, ContactMessage, UserProfile, Notification
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives



# ---------------- CATEGORY → DEPARTMENT MAP ----------------
CATEGORY_DEPARTMENT_MAP = {
    "Deforestation": "Forest",
    "Illegal Wood Smuggling": "Forest",
    "Drainage Issue": "Municipality",
    "Illegal Dumping": "Waste Management",
    "Environmental Damage": "Pollution",
    "Pollution": "Pollution",
    "Road Damage": "Traffic / Roads",
    "Public Health Hazard": "Public Health",
    "Animal Injury": "Wildlife / Animal Control",
}


# ---------------- User Serializer ----------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


# ---------------- Incident Log Serializer ----------------
class IncidentLogSerializer(serializers.ModelSerializer):
    performed_by = serializers.StringRelatedField()

    class Meta:
        model = IncidentLog
        fields = ["id", "action", "performed_by", "created_at"]


# ---------------- Notification Serializer ----------------
class NotificationSerializer(serializers.ModelSerializer):
    incident_title = serializers.CharField(source="incident.title", read_only=True)
    incident_id = serializers.IntegerField(source="incident.id", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "message",
            "is_read",
            "created_at",
            "incident_title",
            "incident_id",
        ]


# ---------------- Incident Serializer ----------------
class IncidentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    confidence = serializers.FloatField(read_only=True)
    department = serializers.CharField(required=False, allow_null=True)
    logs = IncidentLogSerializer(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "title",
            "description",
            "category",
            "department",
            "confidence",
            "status",
            "user",
            "attachment",
            "logs",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "confidence",
            "department",
            "logs",
            "created_at",
        ]

    # -------- FIX 1: AUTO SET DEPARTMENT ON CREATE --------
    def create(self, validated_data):
        request = self.context.get("request")

        category = validated_data.get("category")

        validated_data["department"] = CATEGORY_DEPARTMENT_MAP.get(
            category, "Municipality"
        )

        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        incident = super().create(validated_data)

        IncidentLog.objects.create(
            incident=incident,
            action="Incident created",
            performed_by=request.user if request else None,
        )

        return incident

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")

        if instance.attachment and request:
            data["attachment"] = request.build_absolute_uri(instance.attachment.url)
        else:
            data["attachment"] = None

        return data

    # -------- FIX 2: AUTO UPDATE DEPARTMENT ON CATEGORY CHANGE --------
    def update(self, instance, validated_data):
        request = self.context.get("request")

        old_status = instance.status
        old_category = instance.category

        if not (request and request.user.is_staff):
            validated_data.pop("status", None)
            validated_data.pop("category", None)

        updated_instance = super().update(instance, validated_data)

        if old_category != updated_instance.category:
            updated_instance.department = CATEGORY_DEPARTMENT_MAP.get(
                updated_instance.category, "Municipality"
            )
            updated_instance.save(update_fields=["department"])

            IncidentLog.objects.create(
                incident=updated_instance,
                action=f"Category changed to '{updated_instance.category}' (Department auto-updated)",
                performed_by=request.user,
            )
        


        if old_status != updated_instance.status:
            IncidentLog.objects.create(
                incident=updated_instance,
                action=f"Status changed from '{old_status}' to '{updated_instance.status}'",
                performed_by=request.user,
            )
        if (old_status != updated_instance.status or old_category != updated_instance.category) \
                and updated_instance.user.email:

            html_content = render_to_string(
                "emails/incident_updated.html",
                {
                    "username": updated_instance.user.username,
                    "incident_id": updated_instance.id,
                    "title": updated_instance.title,
                    "status": updated_instance.status,
                    "category": updated_instance.category,
                    "department": updated_instance.department,
                }
            )

            email = EmailMultiAlternatives(
                subject="Update on Your Reported Incident",
                body="Your incident has been updated.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[updated_instance.user.email],
            )

            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=True)


        return updated_instance


# ---------------- Contact Message Serializer ----------------
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

# ---------------- Signup Serializer ----------------

class SignupSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "phone",
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        phone = validated_data.pop("phone", None)

        user = User.objects.create_user(**validated_data)

        UserProfile.objects.get_or_create(
            user=user,
            defaults={"phone": phone},
        )

        # ---------------- SEND WELCOME EMAIL ----------------
        if user.email:
            html_content = render_to_string(
                "emails/welcome_user.html",
                {
                    "username": user.username,
                }
            )

            email = EmailMultiAlternatives(
                subject="Welcome to Incident Platform",
                body="Welcome to Incident Platform!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )

            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)  # keep False for debugging

        return user


# ---------------- User Profile Serializer ----------------
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["phone", "city", "role"]
