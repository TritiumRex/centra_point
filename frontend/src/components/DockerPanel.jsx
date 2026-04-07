import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
  running: 'bg-green-500',
  exited: 'bg-red-500',
  paused: 'bg-yellow-500',
  restarting: 'bg-blue-500',
  created: 'bg-gray-500',
  dead: 'bg-red-700',
};

function StatusDot({ status }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-500'}`}
      title={status}
    />
  );
}

function ContainerRow({ container, onAction }) {
  const [acting, setActing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState('');

  const isRunning = container.state === 'running';

  const handleAction = async (action) => {
    setActing(true);
    await onAction(container.name, action);
    setActing(false);
  };

  const fetchLogs = async () => {
    if (showLogs) {
      setShowLogs(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
      const res = await api.get(`/proxy/docker/containers/${container.name}/logs/?tail=50`, { headers });
      setLogs(res.data.logs || 'No logs available');
      setShowLogs(true);
    } catch {
      setLogs('Failed to fetch logs');
      setShowLogs(true);
    }
  };

  return (
    <>
      <tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
        <td className="py-2 px-3">
          <div className="flex items-center gap-2">
            <StatusDot status={container.state} />
            <span className="text-sm font-medium text-gray-200">{container.service}</span>
          </div>
        </td>
        <td className="py-2 px-3 text-xs text-gray-400 font-mono truncate max-w-[200px]">{container.image}</td>
        <td className="py-2 px-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isRunning ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {container.status}
          </span>
        </td>
        <td className="py-2 px-3 text-xs text-gray-500 font-mono">
          {container.ports.length > 0 ? container.ports.join(', ') : '-'}
        </td>
        <td className="py-2 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={fetchLogs}
              className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              title="Logs"
            >
              Logs
            </button>
            {isRunning ? (
              <>
                <button
                  onClick={() => handleAction('restart')}
                  disabled={acting}
                  className="px-2 py-1 text-xs rounded bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 transition-colors disabled:opacity-50"
                >
                  Restart
                </button>
                <button
                  onClick={() => handleAction('stop')}
                  disabled={acting}
                  className="px-2 py-1 text-xs rounded bg-red-900/50 text-red-300 hover:bg-red-800/50 transition-colors disabled:opacity-50"
                >
                  Stop
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction('start')}
                disabled={acting}
                className="px-2 py-1 text-xs rounded bg-green-900/50 text-green-300 hover:bg-green-800/50 transition-colors disabled:opacity-50"
              >
                Start
              </button>
            )}
          </div>
        </td>
      </tr>
      {showLogs && (
        <tr>
          <td colSpan={5} className="p-0">
            <pre className="bg-black/50 text-gray-400 text-xs p-3 max-h-48 overflow-auto font-mono whitespace-pre-wrap border-b border-gray-700">
              {logs}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

function StackCard({ name, containers, onAction }) {
  const [expanded, setExpanded] = useState(true);
  const running = containers.filter(c => c.state === 'running').length;
  const total = containers.length;
  const allRunning = running === total;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg mb-3 overflow-hidden">
      {/* Stack header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">{expanded ? '▾' : '▸'}</span>
          <span className={`inline-block w-3 h-3 rounded-full ${allRunning ? 'bg-green-500' : running > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold text-white">{name === '_standalone' ? 'Standalone Containers' : name}</span>
          <span className="text-xs text-gray-500">
            {running}/{total} running
          </span>
        </div>
      </div>

      {/* Container table */}
      {expanded && (
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-t border-gray-700">
              <th className="text-left py-2 px-3 font-medium">Service</th>
              <th className="text-left py-2 px-3 font-medium">Image</th>
              <th className="text-left py-2 px-3 font-medium">Status</th>
              <th className="text-left py-2 px-3 font-medium">Ports</th>
              <th className="text-right py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {containers.map(c => (
              <ContainerRow key={c.id} container={c} onAction={onAction} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function DockerPanel() {
  const [stacks, setStacks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const fetchStacks = useCallback(async () => {
    try {
      const res = await api.get('/proxy/docker/stacks/', { headers });
      setStacks(res.data.stacks || {});
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch Docker stacks');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStacks();
    const interval = setInterval(fetchStacks, 10000);
    return () => clearInterval(interval);
  }, [fetchStacks]);

  const handleAction = async (containerName, action) => {
    try {
      await api.post(`/proxy/docker/containers/${containerName}/${action}/`, {}, { headers });
      // Refresh after a short delay
      setTimeout(fetchStacks, 1500);
    } catch (err) {
      console.error('Container action failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-3" />
          <p>Loading Docker stacks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        <div className="text-center">
          <p className="mb-2">Error: {error}</p>
          <button onClick={fetchStacks} className="text-sm text-blue-400 hover:text-blue-300">Retry</button>
        </div>
      </div>
    );
  }

  const stackNames = Object.keys(stacks).sort((a, b) => {
    if (a === '_standalone') return 1;
    if (b === '_standalone') return -1;
    return a.localeCompare(b);
  });

  const totalContainers = Object.values(stacks).flat().length;
  const runningContainers = Object.values(stacks).flat().filter(c => c.state === 'running').length;

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Docker</h2>
          <p className="text-xs text-gray-500">
            {stackNames.length} stack{stackNames.length !== 1 ? 's' : ''} &middot; {runningContainers}/{totalContainers} containers running
          </p>
        </div>
        <button
          onClick={fetchStacks}
          className="px-3 py-1.5 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stacks */}
      {stackNames.map(name => (
        <StackCard
          key={name}
          name={name}
          containers={stacks[name]}
          onAction={handleAction}
        />
      ))}

      {stackNames.length === 0 && (
        <div className="text-center text-gray-600 py-12">
          No Docker containers found
        </div>
      )}
    </div>
  );
}
