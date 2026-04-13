# views_auth.py

from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User

from .models import UserProfile
from .serializers import SignupSerializer, UserProfileSerializer
from rest_framework.decorators import api_view, permission_classes, parser_classes

from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import random
from .models import PasswordResetOTP
from rest_framework_simplejwt.tokens import RefreshToken

# ================= CSRF (PURE DJANGO VIEW) =================
@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"message": "CSRF cookie set"})

# ================= REGISTER =================
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email", "")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    role = request.data.get("role", "user")
    department_name = request.data.get("department")

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Create User
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    # ✅ Find Department
    department = None
    if role == "department" and department_name:
        from .models import Department
        try:
            department = Department.objects.get(name=department_name)
        except Department.DoesNotExist:
            department = None

    # ✅ Create UserProfile
    UserProfile.objects.create(
        user=user,
        role=role,
        department=department
    )

    return Response(
        {"message": "Registration successful ! Redirecting to login..."},
        status=status.HTTP_201_CREATED
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    user = authenticate(
        username=request.data.get("username"),
        password=request.data.get("password"),
    )

    if not user:
        return Response({"error": "Invalid credentials"}, status=400)

    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
        }
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get("email")

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist"}, status=404)

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Invalidate old OTPs
    PasswordResetOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    otp_obj = PasswordResetOTP(email=email)
    otp_obj.set_otp(otp)
    otp_obj.save()

    # Send OTP email
    html_content = render_to_string(
        "emails/password_otp.html",
        {
            "username": user.username,
            "otp": otp,
        }
    )

    email_msg = EmailMultiAlternatives(
        subject="Password Reset OTP",
        body=f"Your OTP is {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )

    email_msg.attach_alternative(html_content, "text/html")
    email_msg.send(fail_silently=False)

    return Response({"message": "OTP sent to email"}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")

    if not email or not otp:
        return Response({"error": "Email and OTP required"}, status=400)

    try:
        otp_obj = PasswordResetOTP.objects.filter(
            email=email,
            is_used=False,
            expires_at__gte=timezone.now()
        ).latest("created_at")
    except PasswordResetOTP.DoesNotExist:
        return Response({"error": "Invalid or expired OTP"}, status=400)

    if not otp_obj.check_otp(otp):
        return Response({"error": "Incorrect OTP"}, status=400)

    return Response({"message": "OTP verified"}, status=200)



@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    new_password = request.data.get("password")


    if not all([email, otp, new_password]):
        return Response({"error": "All fields required"}, status=400)

    try:
        otp_obj = PasswordResetOTP.objects.filter(
            email=email,
            is_used=False,
            expires_at__gte=timezone.now()
        ).latest("created_at")
    except PasswordResetOTP.DoesNotExist:
        return Response({"error": "Invalid or expired OTP"}, status=400)

    if not otp_obj.check_otp(otp):
        return Response({"error": "Incorrect OTP"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    user.set_password(new_password)
    user.save()

    otp_obj.is_used = True
    otp_obj.save()

    return Response({"message": "Password reset successful"}, status=200)

# ================= PROFILE =================
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def profile_view(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == "GET":
        return Response({
            "username": user.username,
            "email": user.email or "",
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "phone": profile.phone or "",
            "city": profile.city or "",
            "role": profile.role,
            "profile_image": (
                request.build_absolute_uri(profile.profile_image.url)
                if profile.profile_image else None
            ),
        })

    if request.method == "PATCH":
        # user fields
        user.email = request.data.get("email", user.email)
        user.first_name = request.data.get("first_name", user.first_name)
        user.last_name = request.data.get("last_name", user.last_name)
        user.save()

        # profile fields
        profile.phone = request.data.get("phone", profile.phone)
        profile.city = request.data.get("city", profile.city)

        # 🔥 IMAGE SAVE (IMPORTANT)
        if "profile_image" in request.FILES:
            profile.profile_image = request.FILES["profile_image"]

        profile.save()

        return Response({"message": "Profile updated successfully"})

# ================= CURRENT USER =================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email or "",
        "full_name": f"{request.user.first_name} {request.user.last_name}".strip(),

        "role": profile.role,
        "department": profile.department.name if profile.department else None,

        "is_staff": request.user.is_staff,
        "is_superuser": request.user.is_superuser,
    })
