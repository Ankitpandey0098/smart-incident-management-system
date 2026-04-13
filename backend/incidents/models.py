from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import hashlib
import random

# ================= Department Model =================
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name


# ================= Incident Model =================
class Incident(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in progress", "In Progress"),
        ("resolved", "Resolved"),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()

    # ✅ NEW LOCATION FIELDS
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # ML predicted fields
    category = models.CharField(max_length=50, null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)

    # AUTO-PREDICTED DEPARTMENT (stored as string)
    department = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    # ✅ NEW: Prevent duplicate department reporting
    reported_to_department = models.BooleanField(default=False)
    reported_at = models.DateTimeField(null=True, blank=True)

    # ✅ NEW — Allow multiple email sending

    email_sent_count = models.IntegerField(default=0)
    last_email_sent_at = models.DateTimeField(null=True, blank=True)
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="incidents",
        null=True,
        blank=True
    )

    attachment = models.ImageField(
        upload_to="incidents/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"

    def __str__(self):
        return f"{self.title} ({self.status})"


# ================= Incident Log Model =================
class IncidentLog(models.Model):

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="logs"
    )

    action = models.CharField(max_length=255)

    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="performed_logs",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Incident Log"
        verbose_name_plural = "Incident Logs"

    def __str__(self):
        return f"{self.action} (Incident {self.incident.id})"


# ================= Contact Message Model =================
class ContactMessage(models.Model):

    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"

    def __str__(self):
        return f"{self.subject} from {self.name}"


# ================= User Profile Model =================
class UserProfile(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("department", "Department"),
        ("user", "User"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    city = models.CharField(max_length=100, blank=True)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="user"
    )

    # 🔥 Link department user
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"



# ================= Notification Model =================
class Notification(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"Notification for {self.user.username}"

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp_hash = models.CharField(max_length=64)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def set_otp(self, otp):
        self.otp_hash = hashlib.sha256(otp.encode()).hexdigest()

    def check_otp(self, otp):
        return self.otp_hash == hashlib.sha256(otp.encode()).hexdigest()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"OTP for {self.email}"