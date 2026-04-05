from django.urls import path
from . import views

urlpatterns = [
    # Proxmox
    path('proxmox/nodes/', views.proxmox_nodes),
    path('proxmox/nodes/<str:node>/qemu/', views.proxmox_vms),
    path('proxmox/nodes/<str:node>/qemu/<int:vmid>/status/<str:action>/', views.proxmox_vm_action),

    # TrueNAS
    path('truenas/system/info/', views.truenas_system_info),
    path('truenas/pool/', views.truenas_pools),
    path('truenas/pool/dataset/', views.truenas_datasets),
]
