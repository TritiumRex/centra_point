from django.contrib import admin
from .models import Instance

@admin.register(Instance)
class InstanceAdmin(admin.ModelAdmin):
    list_display = ('thing', 'created_by', 'created_at', 'updated_at')
    list_filter = ('thing', 'created_at')
    search_fields = ('data',)
    readonly_fields = ('created_at', 'updated_at', 'created_by')
