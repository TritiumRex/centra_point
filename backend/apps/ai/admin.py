from django.contrib import admin
from .models import AIAnalysis

@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ('instance', 'created_at', 'updated_at')
    search_fields = ('description', 'tags')
    readonly_fields = ('created_at', 'updated_at')
