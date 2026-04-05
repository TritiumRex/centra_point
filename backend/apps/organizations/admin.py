from django.contrib import admin
from .models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner', 'is_active', 'created_at')
    search_fields = ('name', 'slug')
    list_filter = ('is_active', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
