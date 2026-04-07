from django.urls import path
from . import views

urlpatterns = [
    # Proxmox
    path('proxmox/nodes/', views.proxmox_nodes),
    path('proxmox/nodes/<str:node>/qemu/', views.proxmox_vms),
    path('proxmox/nodes/<str:node>/qemu/<int:vmid>/status/<str:action>/', views.proxmox_vm_action),

    # Mailcow
    path('mailcow/status/', views.mailcow_status),
    path('mailcow/mailboxes/', views.mailcow_mailboxes),
    path('mailcow/domains/', views.mailcow_domains),
    path('mailcow/queue/', views.mailcow_queue),

    # TrueNAS
    path('truenas/system/info/', views.truenas_system_info),
    path('truenas/pool/', views.truenas_pools),
    path('truenas/pool/dataset/', views.truenas_datasets),

    # Docker
    path('docker/stacks/', views.docker_stacks),
    path('docker/containers/<str:container_id>/<str:action>/', views.docker_container_action),
    path('docker/containers/<str:container_id>/logs/', views.docker_container_logs),
]
