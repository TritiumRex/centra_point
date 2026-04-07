from django.db import models


class MenuNode(models.Model):
    NODE_TYPES = [
        ('group', 'Group'),
        ('iframe', 'Iframe'),
        ('panel', 'Native Panel'),
        ('ssh', 'SSH Terminal'),
    ]

    PANEL_CHOICES = [
        ('proxmox', 'Proxmox'),
        ('truenas', 'TrueNAS'),
        ('mailcow', 'Mailcow'),
        ('docker', 'Docker'),
    ]

    parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.CASCADE, related_name='children'
    )
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.CASCADE,
        related_name='menu_nodes'
    )
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, blank=True, default='')
    node_type = models.CharField(max_length=10, choices=NODE_TYPES, default='group')
    url = models.URLField(blank=True, default='')
    ssh_host = models.GenericIPAddressField(null=True, blank=True)
    panel_type = models.CharField(max_length=20, choices=PANEL_CHOICES, blank=True, default='')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'label']

    def __str__(self):
        return self.label
