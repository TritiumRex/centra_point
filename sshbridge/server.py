"""
WebSocket-to-SSH bridge for centra_point.
Accepts WebSocket connections at ws://host:8765/?host=<ip>
Establishes SSH using the mounted private key, streams I/O.
"""
import asyncio
import json
import os
import logging

import paramiko
import websockets

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('sshbridge')

SSH_KEY_PATH = os.environ.get('SSH_KEY_PATH', '/ssh/id_ed25519')
SSH_USER = os.environ.get('SSH_USER', 'frank')
SSH_PORT = int(os.environ.get('SSH_PORT', '22'))
LISTEN_PORT = int(os.environ.get('LISTEN_PORT', '8765'))
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '192.168.1.0/24')


def is_allowed(host):
    """Only allow connections to the local subnet."""
    import ipaddress
    try:
        addr = ipaddress.ip_address(host)
        for net in ALLOWED_HOSTS.split(','):
            if addr in ipaddress.ip_network(net.strip(), strict=False):
                return True
    except ValueError:
        pass
    return False


async def ssh_session(websocket):
    """Handle a single WebSocket connection → SSH session."""
    # Parse target host from query params
    path = websocket.request.path if hasattr(websocket, 'request') else ''
    params = {}
    if '?' in (websocket.request.path if hasattr(websocket, 'request') else str(websocket.path)):
        raw = str(websocket.path) if hasattr(websocket, 'path') else ''
        if '?' in raw:
            qs = raw.split('?', 1)[1]
            for pair in qs.split('&'):
                if '=' in pair:
                    k, v = pair.split('=', 1)
                    params[k] = v

    # Also try to get from first message
    if not params.get('host'):
        try:
            msg = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(msg)
            params['host'] = data.get('host', '')
        except Exception:
            await websocket.close(1008, 'No host specified')
            return

    host = params.get('host', '')
    if not host or not is_allowed(host):
        await websocket.send(json.dumps({'error': f'Host not allowed: {host}'}))
        await websocket.close(1008, 'Host not allowed')
        return

    log.info(f'Connecting to {SSH_USER}@{host}:{SSH_PORT}')

    # Establish SSH
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        pkey = paramiko.Ed25519Key.from_private_key_file(SSH_KEY_PATH)
        client.connect(host, port=SSH_PORT, username=SSH_USER, pkey=pkey, timeout=10)
    except Exception as e:
        log.error(f'SSH connection failed to {host}: {e}')
        await websocket.send(json.dumps({'error': f'SSH connection failed: {e}'}))
        await websocket.close(1011, 'SSH connection failed')
        return

    # Open interactive shell
    channel = client.invoke_shell(term='xterm-256color', width=120, height=40)
    channel.setblocking(False)

    await websocket.send(json.dumps({'connected': True, 'host': host}))
    log.info(f'SSH session established to {host}')

    async def read_ssh():
        """Read from SSH channel, send to WebSocket."""
        try:
            while True:
                await asyncio.sleep(0.02)
                if channel.recv_ready():
                    data = channel.recv(4096)
                    if not data:
                        break
                    await websocket.send(data.decode('utf-8', errors='replace'))
                if channel.closed:
                    break
        except Exception:
            pass

    async def write_ssh():
        """Read from WebSocket, write to SSH channel."""
        try:
            async for message in websocket:
                if isinstance(message, str):
                    try:
                        data = json.loads(message)
                        if data.get('type') == 'resize':
                            channel.resize_pty(
                                width=data.get('cols', 120),
                                height=data.get('rows', 40)
                            )
                            continue
                    except (json.JSONDecodeError, ValueError):
                        pass
                    channel.send(message)
                elif isinstance(message, bytes):
                    channel.send(message)
        except websockets.exceptions.ConnectionClosed:
            pass

    try:
        await asyncio.gather(read_ssh(), write_ssh())
    finally:
        channel.close()
        client.close()
        log.info(f'SSH session closed for {host}')


async def main():
    log.info(f'SSH bridge starting on port {LISTEN_PORT}')
    async with websockets.serve(ssh_session, '0.0.0.0', LISTEN_PORT):
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    asyncio.run(main())
