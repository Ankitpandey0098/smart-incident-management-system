# notifications/models.py

from django.db import models
from django.contrib.auth.models import User
from incidents.models import Incident

class Notification(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_notifications"   # ✅ UNIQUE
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="incident_notifications"
    )
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user.username}"
