import requests
import urllib3
import docker
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PROXMOX_HOST = getattr(settings, 'PROXMOX_HOST', 'https://192.168.1.5:8006')
PROXMOX_USER = getattr(settings, 'PROXMOX_USER', 'root@pam')
PROXMOX_PASSWORD = getattr(settings, 'PROXMOX_PASSWORD', '')

MAILCOW_HOST = getattr(settings, 'MAILCOW_HOST', 'https://192.168.1.25')
MAILCOW_API_KEY = getattr(settings, 'MAILCOW_API_KEY', '')

TRUENAS_HOST = getattr(settings, 'TRUENAS_HOST', 'http://192.168.1.10')
TRUENAS_USER = getattr(settings, 'TRUENAS_USER', 'truenas_admin')
TRUENAS_PASSWORD = getattr(settings, 'TRUENAS_PASSWORD', '')


def _proxmox_ticket():
    """Get a Proxmox auth ticket."""
    resp = requests.post(
        f'{PROXMOX_HOST}/api2/json/access/ticket',
        data={'username': PROXMOX_USER, 'password': PROXMOX_PASSWORD},
        verify=False,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()['data']
    return data['ticket'], data['CSRFPreventionToken']


def _proxmox_get(path):
    ticket, csrf = _proxmox_ticket()
    resp = requests.get(
        f'{PROXMOX_HOST}{path}',
        cookies={'PVEAuthCookie': ticket},
        headers={'CSRFPreventionToken': csrf},
        verify=False,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json().get('data', resp.json())


def _proxmox_post(path):
    ticket, csrf = _proxmox_ticket()
    resp = requests.post(
        f'{PROXMOX_HOST}{path}',
        cookies={'PVEAuthCookie': ticket},
        headers={'CSRFPreventionToken': csrf},
        verify=False,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json().get('data', resp.json())


def _truenas_get(path):
    resp = requests.get(
        f'{TRUENAS_HOST}/api/v2.0{path}',
        auth=(TRUENAS_USER, TRUENAS_PASSWORD) if TRUENAS_PASSWORD else None,
        verify=False,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# --- Proxmox views ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proxmox_nodes(request):
    try:
        data = _proxmox_get('/api2/json/nodes')
        return JsonResponse({'nodes': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proxmox_vms(request, node):
    try:
        data = _proxmox_get(f'/api2/json/nodes/{node}/qemu')
        return JsonResponse({'vms': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def proxmox_vm_action(request, node, vmid, action):
    if action not in ('start', 'stop', 'reboot', 'shutdown', 'current'):
        return JsonResponse({'error': 'Invalid action'}, status=400)
    try:
        if action == 'current':
            data = _proxmox_get(f'/api2/json/nodes/{node}/qemu/{vmid}/status/current')
        else:
            data = _proxmox_post(f'/api2/json/nodes/{node}/qemu/{vmid}/status/{action}')
        return JsonResponse({'result': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


def _mailcow_get(path):
    resp = requests.get(
        f'{MAILCOW_HOST}/api/v1{path}',
        headers={'X-API-Key': MAILCOW_API_KEY},
        verify=False,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# --- Mailcow views ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mailcow_status(request):
    try:
        data = _mailcow_get('/get/status/containers')
        return JsonResponse({'containers': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mailcow_mailboxes(request):
    try:
        data = _mailcow_get('/get/mailbox/all')
        return JsonResponse({'mailboxes': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mailcow_domains(request):
    try:
        data = _mailcow_get('/get/domain/all')
        return JsonResponse({'domains': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mailcow_queue(request):
    try:
        data = _mailcow_get('/get/mailq/all')
        return JsonResponse({'queue': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


# --- TrueNAS views ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def truenas_system_info(request):
    try:
        data = _truenas_get('/system/info')
        return JsonResponse({'info': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def truenas_pools(request):
    try:
        data = _truenas_get('/pool')
        return JsonResponse({'pools': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def truenas_datasets(request):
    try:
        data = _truenas_get('/pool/dataset')
        return JsonResponse({'datasets': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


# --- Docker views ---

def _docker_client():
    return docker.DockerClient(base_url='unix:///var/run/docker.sock')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def docker_stacks(request):
    """List all containers grouped by compose project (stack)."""
    try:
        client = _docker_client()
        containers = client.containers.list(all=True)
        stacks = {}
        for c in containers:
            labels = c.labels or {}
            project = labels.get('com.docker.compose.project', '_standalone')
            if project not in stacks:
                stacks[project] = []
            stacks[project].append({
                'id': c.short_id,
                'name': c.name,
                'image': c.image.tags[0] if c.image.tags else c.image.short_id,
                'status': c.status,
                'state': c.attrs.get('State', {}).get('Status', c.status),
                'ports': _format_ports(c.ports),
                'created': c.attrs.get('Created', ''),
                'service': labels.get('com.docker.compose.service', c.name),
            })
        # Sort containers within each stack by service name
        for project in stacks:
            stacks[project].sort(key=lambda x: x['service'])
        return JsonResponse({'stacks': stacks}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


def _format_ports(ports):
    """Format Docker port bindings into readable strings."""
    result = []
    for container_port, bindings in (ports or {}).items():
        if bindings:
            for b in bindings:
                host_port = b.get('HostPort', '')
                if host_port:
                    result.append(f"{host_port}→{container_port}")
        else:
            result.append(container_port)
    return result


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def docker_container_action(request, container_id, action):
    """Start, stop, or restart a container."""
    if action not in ('start', 'stop', 'restart'):
        return JsonResponse({'error': 'Invalid action'}, status=400)
    try:
        client = _docker_client()
        container = client.containers.get(container_id)
        getattr(container, action)()
        container.reload()
        return JsonResponse({
            'result': 'ok',
            'status': container.status,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def docker_container_logs(request, container_id):
    """Get recent logs for a container."""
    try:
        client = _docker_client()
        container = client.containers.get(container_id)
        tail = int(request.GET.get('tail', 100))
        logs = container.logs(tail=tail, timestamps=True).decode('utf-8', errors='replace')
        return JsonResponse({'logs': logs})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=502)
