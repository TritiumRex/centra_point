from django.contrib import admin
from .models import UserOrganizationRole, UserProfile

@admin.register(UserOrganizationRole)
class UserOrganizationRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'created_at')
    list_filter = ('role', 'organization')
    search_fields = ('user__email', 'organization__name')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization')
    search_fields = ('user__email', 'organization__name')
