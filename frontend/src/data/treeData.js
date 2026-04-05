const treeData = [
  {
    id: 'proxmox',
    label: 'Proxmox',
    icon: '🖥',
    children: [
      { id: 'proxmox-ui', label: 'Proxmox UI', icon: '◎', panel: 'proxmox', url: 'http://localhost:9006/' },
      {
        id: 'proxmox-vms',
        label: 'Virtual Machines',
        icon: '▸',
        children: [
          { id: 'vm-dns', label: 'dns (192.168.1.12)', icon: '●', sshHost: '192.168.1.12' },
          { id: 'vm-ansible', label: 'ansible (192.168.1.19)', icon: '●', sshHost: '192.168.1.19' },
          { id: 'vm-arr', label: 'arr (192.168.1.20)', icon: '●', sshHost: '192.168.1.20' },
          { id: 'vm-arr2', label: 'arr2 (192.168.1.21)', icon: '●', sshHost: '192.168.1.21' },
          { id: 'vm-llm', label: 'llm (192.168.1.23)', icon: '●', sshHost: '192.168.1.23' },
          { id: 'vm-mail', label: 'mail (192.168.1.25)', icon: '●', sshHost: '192.168.1.25' },
          { id: 'vm-rsyslog', label: 'rsyslogd (192.168.1.26)', icon: '●', sshHost: '192.168.1.26' },
          { id: 'vm-web', label: 'web (192.168.1.27)', icon: '●', sshHost: '192.168.1.27' },
          { id: 'vm-mirror', label: 'mirror (192.168.1.30)', icon: '●', sshHost: '192.168.1.30' },
        ],
      },
    ],
  },
  {
    id: 'arr',
    label: 'arr Stack',
    icon: '🎬',
    children: [
      {
        id: 'arr-media',
        label: 'Media Management',
        icon: '▸',
        children: [
          { id: 'radarr', label: 'Radarr', icon: '🎥', url: 'http://192.168.1.20:7878' },
          { id: 'sonarr', label: 'Sonarr', icon: '📺', url: 'http://192.168.1.20:8989' },
          { id: 'lidarr', label: 'Lidarr', icon: '🎵', url: 'http://192.168.1.20:8686' },
          { id: 'bazarr', label: 'Bazarr', icon: '💬', url: 'http://192.168.1.20:6767' },
        ],
      },
      {
        id: 'arr-downloads',
        label: 'Downloads',
        icon: '▸',
        children: [
          { id: 'qbit', label: 'qBittorrent', icon: '⬇', url: 'http://192.168.1.20:8080' },
          { id: 'prowlarr', label: 'Prowlarr', icon: '🔍', url: 'http://192.168.1.20:9696' },
        ],
      },
      {
        id: 'arr-playback',
        label: 'Playback',
        icon: '▸',
        children: [
          { id: 'jellyfin', label: 'Jellyfin', icon: '▶', url: 'http://192.168.1.20:8096' },
        ],
      },
      {
        id: 'arr-infra',
        label: 'Infrastructure',
        icon: '▸',
        children: [
          { id: 'gluetun', label: 'Gluetun VPN', icon: '🔒' },
          { id: 'flaresolverr', label: 'FlareSolverr', icon: '☁', url: 'http://192.168.1.20:8192' },
        ],
      },
    ],
  },
  {
    id: 'truenas',
    label: 'TrueNAS',
    icon: '💾',
    children: [
      { id: 'truenas-ui', label: 'TrueNAS Admin', icon: '◎', panel: 'truenas', url: 'http://192.168.1.10' },
      { id: 'comfyui', label: 'ComfyUI', icon: '🖼', url: 'http://192.168.1.10:8188' },
      { id: 'musicgen', label: 'MusicGen', icon: '🎶', url: 'http://192.168.1.10:7865' },
      { id: 'ollama', label: 'Ollama', icon: '🤖', url: 'http://192.168.1.10:30068' },
      { id: 'open-webui', label: 'Open WebUI', icon: '💬', url: 'http://localhost:3002' },
    ],
  },
  {
    id: 'dns',
    label: 'DNS / Proxy',
    icon: '🌐',
    children: [
      { id: 'technitium', label: 'Technitium DNS', icon: '◎', url: 'http://192.168.1.12:5380' },
    ],
  },
  {
    id: 'mail',
    label: 'Mail',
    icon: '✉',
    children: [
      { id: 'mailcow', label: 'Mailcow Admin', icon: '◎', url: 'http://localhost:9025/' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: '📊',
    children: [
      { id: 'kibana', label: 'Kibana', icon: '◎', url: 'http://localhost:9200/' },
      { id: 'rsyslog', label: 'rsyslogd', icon: '📋', sshHost: '192.168.1.26' },
    ],
  },
  {
    id: 'workstation',
    label: 'Workstation',
    icon: '💻',
    children: [
      { id: 'tts', label: 'Chatterbox TTS', icon: '🔊', url: 'http://localhost:8004' },
      {
        id: 'workstation-docker',
        label: 'Docker',
        icon: '▸',
        children: [],
      },
    ],
  },
  {
    id: 'websites',
    label: 'Websites',
    icon: '🌍',
    children: [
      { id: 'oi-internal', label: 'Online Ingenuity (local)', icon: '◎', url: 'http://192.168.1.27:3000' },
      { id: 'oi-public', label: 'Online Ingenuity', icon: '◎', url: 'https://onlineingenuity.com' },
    ],
  },
];

export default treeData;
