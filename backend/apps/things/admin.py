from django.contrib import admin
from .models import Thing, ThingField

class ThingFieldInline(admin.TabularInline):
    model = ThingField
    extra = 1

@admin.register(Thing)
class ThingAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'is_active', 'created_at')
    list_filter = ('organization', 'is_active', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ThingFieldInline]
