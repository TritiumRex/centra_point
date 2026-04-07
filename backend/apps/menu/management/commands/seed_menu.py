from django.core.management.base import BaseCommand
from apps.menu.models import MenuNode
from apps.organizations.models import Organization


SEED_TREE = [
    {
        'label': 'Proxmox', 'icon': '\U0001f5a5', 'node_type': 'group', 'sort_order': 0,
        'children': [
            {'label': 'Proxmox UI', 'icon': '\u25ce', 'node_type': 'panel', 'panel_type': 'proxmox', 'url': 'http://localhost:9006/', 'sort_order': 0},
            {
                'label': 'SSH', 'icon': '\u25b8', 'node_type': 'group', 'sort_order': 1,
                'children': [
                    {'label': 'dns (192.168.1.12)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.12', 'sort_order': 0},
                    {'label': 'monitor (192.168.1.19)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.19', 'sort_order': 1},
                    {'label': 'arr (192.168.1.20)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.20', 'sort_order': 2},
                    {'label': 'arr2 (192.168.1.21)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.21', 'sort_order': 3},
                    {'label': 'llm (192.168.1.23)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.23', 'sort_order': 4},
                    {'label': 'mail (192.168.1.25)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.25', 'sort_order': 5},
                    {'label': 'rsyslogd (192.168.1.26)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.26', 'sort_order': 6},
                    {'label': 'web (192.168.1.27)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.27', 'sort_order': 7},
                    {'label': 'mirror (192.168.1.30)', 'icon': '\u25cf', 'node_type': 'ssh', 'ssh_host': '192.168.1.30', 'sort_order': 8},
                ],
            },
        ],
    },
    {
        'label': 'arr Stack', 'icon': '\U0001f3ac', 'node_type': 'group', 'sort_order': 1,
        'children': [
            {'label': 'Radarr', 'icon': '\U0001f3a5', 'node_type': 'iframe', 'url': 'http://192.168.1.20:7878', 'sort_order': 0},
            {'label': 'Sonarr', 'icon': '\U0001f4fa', 'node_type': 'iframe', 'url': 'http://192.168.1.20:8989', 'sort_order': 1},
            {'label': 'Lidarr', 'icon': '\U0001f3b5', 'node_type': 'iframe', 'url': 'http://192.168.1.20:8686', 'sort_order': 2},
            {'label': 'Bazarr', 'icon': '\U0001f4ac', 'node_type': 'iframe', 'url': 'http://192.168.1.20:6767', 'sort_order': 3},
            {'label': 'Prowlarr', 'icon': '\U0001f50d', 'node_type': 'iframe', 'url': 'http://192.168.1.20:9696', 'sort_order': 4},
            {'label': 'qBittorrent', 'icon': '\u2b07', 'node_type': 'iframe', 'url': 'http://localhost:9080', 'sort_order': 5},
            {'label': 'Jellyfin', 'icon': '\u25b6', 'node_type': 'iframe', 'url': 'http://192.168.1.20:8096', 'sort_order': 6},
            {'label': 'FlareSolverr', 'icon': '\u2601', 'node_type': 'iframe', 'url': 'http://192.168.1.20:8192', 'sort_order': 7},
            {'label': 'Gluetun VPN', 'icon': '\U0001f512', 'node_type': 'group', 'sort_order': 8},
        ],
    },
    {
        'label': 'TrueNAS', 'icon': '\U0001f4be', 'node_type': 'group', 'sort_order': 2,
        'children': [
            {'label': 'TrueNAS Admin', 'icon': '\u25ce', 'node_type': 'panel', 'panel_type': 'truenas', 'url': 'http://192.168.1.10', 'sort_order': 0},
            {'label': 'ComfyUI', 'icon': '\U0001f5bc', 'node_type': 'iframe', 'url': 'http://192.168.1.10:8188', 'sort_order': 1},
            {'label': 'MusicGen', 'icon': '\U0001f3b6', 'node_type': 'iframe', 'url': 'http://192.168.1.10:7865', 'sort_order': 2},
            {'label': 'Ollama', 'icon': '\U0001f916', 'node_type': 'iframe', 'url': 'http://192.168.1.10:30068', 'sort_order': 3},
            {'label': 'Open WebUI', 'icon': '\U0001f4ac', 'node_type': 'iframe', 'url': 'http://localhost:3002', 'sort_order': 4},
        ],
    },
    {
        'label': 'DNS / Proxy', 'icon': '\U0001f310', 'node_type': 'group', 'sort_order': 3,
        'children': [
            {'label': 'Technitium DNS', 'icon': '\u25ce', 'node_type': 'iframe', 'url': 'http://192.168.1.12:5380', 'sort_order': 0},
        ],
    },
    {
        'label': 'Mail', 'icon': '\u2709', 'node_type': 'group', 'sort_order': 4,
        'children': [
            {'label': 'Mailcow Admin', 'icon': '\u25ce', 'node_type': 'panel', 'panel_type': 'mailcow', 'url': 'https://192.168.1.25', 'sort_order': 0},
        ],
    },
    {
        'label': 'Monitoring', 'icon': '\U0001f4ca', 'node_type': 'group', 'sort_order': 5,
        'children': [
            {'label': 'Monitoring Hub', 'icon': '\U0001f3e0', 'node_type': 'iframe', 'url': 'http://localhost:9033/', 'sort_order': -1},
            {'label': 'Grafana', 'icon': '\U0001f4c8', 'node_type': 'iframe', 'url': 'http://localhost:9030/d/homelab-overview', 'sort_order': 0},
            {'label': 'Uptime Kuma', 'icon': '\u2705', 'node_type': 'iframe', 'url': 'http://localhost:9031/status/status', 'sort_order': 1},
            {'label': 'Dockge', 'icon': '\U0001f433', 'node_type': 'iframe', 'url': 'http://localhost:9032/', 'sort_order': 2},
            {'label': 'Kibana', 'icon': '\u25ce', 'node_type': 'iframe', 'url': 'http://localhost:9200/', 'sort_order': 3},
            {'label': 'Prometheus', 'icon': '\U0001f525', 'node_type': 'iframe', 'url': 'http://192.168.1.19:9090/', 'sort_order': 4},
            {'label': 'Alertmanager', 'icon': '\U0001f514', 'node_type': 'iframe', 'url': 'http://192.168.1.19:9093/', 'sort_order': 5},
            {'label': 'Smokeping', 'icon': '\U0001f4f6', 'node_type': 'iframe', 'url': 'http://192.168.1.19:8090/', 'sort_order': 6},
            {'label': 'rsyslogd', 'icon': '\U0001f4cb', 'node_type': 'ssh', 'ssh_host': '192.168.1.26', 'sort_order': 7},
        ],
    },
    {
        'label': 'Workstation', 'icon': '\U0001f4bb', 'node_type': 'group', 'sort_order': 6,
        'children': [
            {'label': 'Chatterbox TTS', 'icon': '\U0001f50a', 'node_type': 'iframe', 'url': 'http://localhost:8004', 'sort_order': 0},
            {'label': 'Docker', 'icon': '\U0001f433', 'node_type': 'panel', 'panel_type': 'docker', 'sort_order': 1},
        ],
    },
    {
        'label': 'Websites', 'icon': '\U0001f30d', 'node_type': 'group', 'sort_order': 7,
        'children': [
            {'label': 'Online Ingenuity (local)', 'icon': '\u25ce', 'node_type': 'iframe', 'url': 'http://192.168.1.27:3000', 'sort_order': 0},
            {'label': 'Online Ingenuity', 'icon': '\u25ce', 'node_type': 'iframe', 'url': 'https://onlineingenuity.com', 'sort_order': 1},
        ],
    },
    {
        'label': 'Documentation', 'icon': '\U0001f4d6', 'node_type': 'group', 'sort_order': 8,
        'children': [
            {'label': 'Lab Wiki', 'icon': '\U0001f4da', 'node_type': 'iframe', 'url': 'http://localhost:3080/', 'sort_order': 0},
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the menu tree from hardcoded data'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Force reseed')

    def handle(self, *args, **options):
        org = Organization.objects.first()
        if not org:
            self.stderr.write('No organization found. Create one first.')
            return

        if MenuNode.objects.filter(organization=org).exists():
            if not options.get('force'):
                self.stdout.write('Menu already seeded. Use --force to reseed.')
                return
            MenuNode.objects.filter(organization=org).delete()
            self.stdout.write('Cleared existing menu nodes.')

        def create_nodes(nodes, parent=None):
            for data in nodes:
                children_data = data.pop('children', [])
                node = MenuNode.objects.create(
                    organization=org, parent=parent, **data
                )
                if children_data:
                    create_nodes(children_data, parent=node)

        create_nodes(SEED_TREE)
        count = MenuNode.objects.filter(organization=org).count()
        self.stdout.write(self.style.SUCCESS(f'Seeded {count} menu nodes for {org.name}'))
