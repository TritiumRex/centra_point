import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('access_token');
}

function StatusDot({ state }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${state === 'running' ? 'bg-green-500' : 'bg-red-500'}`} />
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export default function MailcowPanel() {
  const [containers, setContainers] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statusRes, mbRes, domRes, queueRes] = await Promise.all([
        axios.get(`${API}/proxy/mailcow/status/`, { headers }),
        axios.get(`${API}/proxy/mailcow/mailboxes/`, { headers }),
        axios.get(`${API}/proxy/mailcow/domains/`, { headers }),
        axios.get(`${API}/proxy/mailcow/queue/`, { headers }).catch(() => ({ data: { queue: [] } })),
      ]);
      setContainers(statusRes.data.containers || {});
      setMailboxes(mbRes.data.mailboxes || []);
      setDomains(domRes.data.domains || []);
      setQueue(Array.isArray(queueRes.data.queue) ? queueRes.data.queue : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">&#9881;</div>
          <p>Connecting to Mailcow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        <div className="text-center max-w-md">
          <p className="text-lg mb-2">Connection Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const containerList = containers ? Object.entries(containers).sort((a, b) => a[0].localeCompare(b[0])) : [];
  const runningCount = containerList.filter(([, c]) => c.state === 'running').length;

  return (
    <div className="flex-1 overflow-auto bg-gray-900 p-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Containers</div>
          <div className="text-xl font-bold text-white">{runningCount} / {containerList.length}</div>
          <div className="text-xs text-green-400">running</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Domains</div>
          <div className="text-xl font-bold text-white">{domains.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Mailboxes</div>
          <div className="text-xl font-bold text-white">{mailboxes.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Mail Queue</div>
          <div className="text-xl font-bold text-white">{queue.length}</div>
          <div className="text-xs text-gray-500">{queue.length === 0 ? 'clear' : 'pending'}</div>
        </div>
      </div>

      {/* Domains */}
      {domains.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Domains</h2>
          <div className="rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Domain</th>
                  <th className="px-4 py-3 text-left">Active</th>
                  <th className="px-4 py-3 text-left">Mailboxes</th>
                  <th className="px-4 py-3 text-left">Aliases</th>
                  <th className="px-4 py-3 text-left">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {domains.map(d => (
                  <tr key={d.domain_name} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{d.domain_name}</td>
                    <td className="px-4 py-3">
                      <StatusDot state={d.active === 1 ? 'running' : 'stopped'} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{d.mboxes_in_domain || 0}</td>
                    <td className="px-4 py-3 text-gray-400">{d.aliases_in_domain || 0}</td>
                    <td className="px-4 py-3 text-gray-400">{d.max_quota_for_domain ? formatBytes(d.max_quota_for_domain) : 'unlimited'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mailboxes */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Mailboxes</h2>
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Used</th>
                <th className="px-4 py-3 text-left">Quota</th>
                <th className="px-4 py-3 text-left">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mailboxes.map(mb => (
                <tr key={mb.username} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{mb.username}</td>
                  <td className="px-4 py-3">
                    <StatusDot state={mb.active === 1 ? 'running' : 'stopped'} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">{mb.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{formatBytes(mb.quota_used)}</td>
                  <td className="px-4 py-3 text-gray-400">{mb.quota ? formatBytes(mb.quota) : 'unlimited'}</td>
                  <td className="px-4 py-3 text-gray-400">{mb.messages || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Containers */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Containers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {containerList.map(([name, info]) => (
            <div key={name} className="flex items-center gap-2 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-xs">
              <StatusDot state={info.state} />
              <span className="text-gray-300 truncate">{name.replace('-mailcow', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
