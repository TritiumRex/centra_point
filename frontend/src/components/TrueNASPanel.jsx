import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('access_token');
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  const tb = bytes / (1024 ** 4);
  if (tb >= 1) return `${tb.toFixed(2)} TB`;
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

function ProgressBar({ used, total, label }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500';
  return (
    <div>
      {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1">{formatBytes(used)} / {formatBytes(total)} ({pct.toFixed(1)}%)</div>
    </div>
  );
}

export default function TrueNASPanel() {
  const [info, setInfo] = useState(null);
  const [pools, setPools] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [infoRes, poolsRes, datasetsRes] = await Promise.all([
        axios.get(`${API}/proxy/truenas/system/info/`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/proxy/truenas/pool/`, { headers }).catch(() => ({ data: { pools: [] } })),
        axios.get(`${API}/proxy/truenas/pool/dataset/`, { headers }).catch(() => ({ data: { datasets: [] } })),
      ]);
      setInfo(infoRes.data.info || null);
      setPools(poolsRes.data.pools || []);
      setDatasets(datasetsRes.data.datasets || []);
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
          <p>Connecting to TrueNAS...</p>
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
      {/* System info */}
      {info && (
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">System Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {info.version && (
              <div>
                <span className="text-gray-500">Version</span>
                <p className="text-white">{info.version}</p>
              </div>
            )}
            {info.hostname && (
              <div>
                <span className="text-gray-500">Hostname</span>
                <p className="text-white">{info.hostname}</p>
              </div>
            )}
            {info.uptime_seconds && (
              <div>
                <span className="text-gray-500">Uptime</span>
                <p className="text-white">
                  {Math.floor(info.uptime_seconds / 86400)}d {Math.floor((info.uptime_seconds % 86400) / 3600)}h
                </p>
              </div>
            )}
            {info.model && (
              <div>
                <span className="text-gray-500">Model</span>
                <p className="text-white">{info.model}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pools */}
      <h2 className="text-lg font-semibold text-white mb-3">Storage Pools</h2>
      <div className="grid gap-4 mb-6">
        {pools.map(pool => {
          const allocated = pool.allocated || 0;
          const size = pool.size || 0;
          const healthy = pool.healthy !== false;
          return (
            <div key={pool.id || pool.name} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <h3 className="text-white font-medium">{pool.name}</h3>
                <span className="text-xs text-gray-500">{pool.topology?.data?.[0]?.type || pool.status || ''}</span>
              </div>
              <ProgressBar used={allocated} total={size} label="Used Space" />
            </div>
          );
        })}
        {pools.length === 0 && (
          <p className="text-gray-500 text-sm">No pools found. Check TrueNAS API key configuration.</p>
        )}
      </div>

      {/* Datasets */}
      {datasets.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-3">Datasets</h2>
          <div className="rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Used</th>
                  <th className="px-4 py-3 text-left">Available</th>
                  <th className="px-4 py-3 text-left">Compression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {datasets.map(ds => (
                  <tr key={ds.id || ds.name} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">{ds.name || ds.id}</td>
                    <td className="px-4 py-3 text-gray-400">{ds.type || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatBytes(ds.used?.parsed || ds.used?.rawvalue)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatBytes(ds.available?.parsed || ds.available?.rawvalue)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {ds.compression?.value || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
