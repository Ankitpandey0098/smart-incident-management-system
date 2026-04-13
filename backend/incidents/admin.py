from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Department
from .models import Incident, ContactMessage, IncidentLog, UserProfile


# ================= Incident Log Inline =================
class IncidentLogInline(admin.TabularInline):
    model = IncidentLog
    extra = 0
    readonly_fields = ("action", "performed_by", "created_at")
    can_delete = False



@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone")
    search_fields = ("name", "email")
    
# ================= Incident Admin =================
@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "status", "user", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("title", "description", "user__username")
    inlines = [IncidentLogInline]


# ================= Contact Message Admin =================
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "subject", "created_at")
    search_fields = ("name", "email", "subject", "message")
    list_filter = ("created_at",)


# ================= Incident Log Admin =================
@admin.register(IncidentLog)
class IncidentLogAdmin(admin.ModelAdmin):
    list_display = ("id", "incident", "action", "performed_by", "created_at")
    list_filter = ("created_at",)
    search_fields = ("action", "performed_by__username", "incident__title")
    readonly_fields = ("action", "performed_by", "created_at")


# ================= User Profile Inline =================
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    fields = ("phone", "city", "role", "department")



# ================= Custom User Admin =================
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")


# ================= Register User Admin =================
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
