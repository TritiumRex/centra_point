import React, { useState, useEffect } from 'react';

const SERVICES = [
  { name: 'TrueNAS', url: 'http://192.168.1.10', group: 'TrueNAS' },
  { name: 'ComfyUI', url: 'http://192.168.1.10:8188', group: 'TrueNAS' },
  { name: 'MusicGen', url: 'http://192.168.1.10:7865', group: 'TrueNAS' },
  { name: 'Ollama', url: 'http://192.168.1.10:30068', group: 'TrueNAS' },
  { name: 'Technitium', url: 'http://192.168.1.12:5380', group: 'DNS' },
  { name: 'Proxmox', url: 'https://192.168.1.5:8006', group: 'Infra' },
  { name: 'Online Ingenuity', url: 'http://192.168.1.27:3000', group: 'Web' },
  { name: 'Chatterbox TTS', url: 'http://localhost:8004', group: 'Workstation' },
];

const GROUPS = [...new Set(SERVICES.map((s) => s.group))];

function StatusDot({ status }) {
  const colors = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
    unknown: 'bg-gray-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status] || colors.unknown}`} />;
}

export default function Services() {
  const [active, setActive] = useState(null);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const checkHealth = async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(url, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        return 'up';
      } catch {
        return 'down';
      }
    };

    const checkAll = async () => {
      for (const svc of SERVICES) {
        const status = await checkHealth(svc.url);
        setStatuses((prev) => ({ ...prev, [svc.url]: status }));
      }
    };

    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full">
      {/* Left sidebar — service tree */}
      <aside className="w-52 bg-gray-950 border-r border-gray-800 overflow-y-auto shrink-0 py-3">
        {GROUPS.map((group) => (
          <div key={group} className="mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-1">{group}</h3>
            {SERVICES.filter((s) => s.group === group).map((svc) => (
              <button
                key={svc.url}
                onClick={() => setActive(svc)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  active?.url === svc.url
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <StatusDot status={statuses[svc.url] || 'unknown'} />
                {svc.name}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main content — iframe or placeholder */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {active && (
          <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0">
            <span className="text-sm font-medium text-white">{active.name}</span>
            <span className="text-xs text-gray-500">{active.url}</span>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-gray-500 hover:text-blue-400 transition-colors"
            >
              Open in new tab ↗
            </a>
          </div>
        )}
        {active ? (
          <iframe
            src={active.url}
            title={active.name}
            className="flex-1 w-full border-0 bg-white"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a service
          </div>
        )}
      </div>
    </div>
  );
}
