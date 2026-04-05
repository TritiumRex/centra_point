import requests
import urllib3
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PROXMOX_HOST = getattr(settings, 'PROXMOX_HOST', 'https://192.168.1.5:8006')
PROXMOX_USER = getattr(settings, 'PROXMOX_USER', 'root@pam')
PROXMOX_PASSWORD = getattr(settings, 'PROXMOX_PASSWORD', '')

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
