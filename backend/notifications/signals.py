from django.db.models.signals import pre_save
from django.dispatch import receiver
from incidents.models import Incident
from .models import Notification

@receiver(pre_save, sender=Incident)
def incident_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    old_incident = Incident.objects.get(pk=instance.pk)

    if old_incident.status != instance.status:
        Notification.objects.create(
            user=instance.user,
            incident=instance,
            message=f"Incident status changed from {old_incident.status} to {instance.status}"
        )
