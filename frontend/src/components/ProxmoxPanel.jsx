import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('access_token');
}

function StatusBadge({ status }) {
  const colors = {
    running: 'bg-green-500',
    stopped: 'bg-red-500',
    paused: 'bg-yellow-500',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-500'}`} title={status} />
  );
}

function formatUptime(seconds) {
  if (!seconds) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes) {
  if (!bytes) return '-';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export default function ProxmoxPanel() {
  const [nodes, setNodes] = useState([]);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const nodesRes = await axios.get(`${API}/proxy/proxmox/nodes/`, { headers });
      const nodeList = nodesRes.data.nodes || [];
      setNodes(nodeList);

      // Fetch VMs from all nodes
      const allVms = [];
      for (const node of nodeList) {
        try {
          const vmRes = await axios.get(`${API}/proxy/proxmox/nodes/${node.node}/qemu/`, { headers });
          const vmList = (vmRes.data.vms || []).map(vm => ({ ...vm, nodeName: node.node }));
          allVms.push(...vmList);
        } catch (e) {
          // Node might not have VMs
        }
      }
      allVms.sort((a, b) => a.vmid - b.vmid);
      setVms(allVms);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (node, vmid, action) => {
    setActionLoading(`${vmid}-${action}`);
    try {
      await axios.post(
        `${API}/proxy/proxmox/nodes/${node}/qemu/${vmid}/status/${action}/`,
        {},
        { headers }
      );
      setTimeout(fetchData, 2000);
    } catch (e) {
      alert(`Failed to ${action} VM ${vmid}: ${e.response?.data?.error || e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">&#9881;</div>
          <p>Connecting to Proxmox...</p>
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

  return (
    <div className="flex-1 overflow-auto bg-gray-900 p-4">
      {/* Node summary */}
      {nodes.map(node => (
        <div key={node.node} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={node.status === 'online' ? 'running' : 'stopped'} />
            <h2 className="text-lg font-semibold text-white">{node.node}</h2>
            <span className="text-xs text-gray-500">
              Uptime: {formatUptime(node.uptime)}
            </span>
            <span className="text-xs text-gray-500">
              CPU: {((node.cpu || 0) * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">
              RAM: {formatBytes(node.mem)} / {formatBytes(node.maxmem)}
            </span>
          </div>
        </div>
      ))}

      {/* VM table */}
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">VMID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">CPU</th>
              <th className="px-4 py-3 text-left">Memory</th>
              <th className="px-4 py-3 text-left">Uptime</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {vms.map(vm => (
              <tr key={vm.vmid} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono">{vm.vmid}</td>
                <td className="px-4 py-3 text-white font-medium">{vm.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <StatusBadge status={vm.status} />
                    <span className="text-gray-300">{vm.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {vm.status === 'running' ? `${((vm.cpu || 0) * 100).toFixed(1)}%` : '-'}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {vm.status === 'running'
                    ? `${formatBytes(vm.mem)} / ${formatBytes(vm.maxmem)}`
                    : formatBytes(vm.maxmem)}
                </td>
                <td className="px-4 py-3 text-gray-400">{formatUptime(vm.uptime)}</td>
                <td className="px-4 py-3 text-right">
                  {vm.status === 'running' ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleAction(vm.nodeName, vm.vmid, 'reboot')}
                        disabled={actionLoading === `${vm.vmid}-reboot`}
                        className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30 disabled:opacity-50"
                      >
                        Reboot
                      </button>
                      <button
                        onClick={() => handleAction(vm.nodeName, vm.vmid, 'stop')}
                        disabled={actionLoading === `${vm.vmid}-stop`}
                        className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 disabled:opacity-50"
                      >
                        Stop
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAction(vm.nodeName, vm.vmid, 'start')}
                      disabled={actionLoading === `${vm.vmid}-start`}
                      className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
