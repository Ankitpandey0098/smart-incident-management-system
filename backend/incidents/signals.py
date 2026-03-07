from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created and instance.email:
        send_mail(
            subject="Welcome to Incident Platform",
            message=(
                f"Hello {instance.username},\n\n"
                "Your account has been created successfully.\n"
                "You can now report incidents and track their status.\n\n"
                "Thank you for joining us."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=True,
        )
