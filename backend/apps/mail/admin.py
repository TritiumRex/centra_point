from django.contrib import admin
from .models import EmailAccount

@admin.register(EmailAccount)
class EmailAccountAdmin(admin.ModelAdmin):
    list_display = ('email', 'organization', 'is_active', 'created_at')
    search_fields = ('email',)
    list_filter = ('organization', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
