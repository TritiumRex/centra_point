import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateInstanceModal({ thingId, onClose, onCreated }) {
  const [data, setData] = useState('{}');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const parsed = JSON.parse(data);
      const res = await api.post('/instances/', { thing: thingId, data: parsed });
      onCreated(res.data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON');
      } else {
        setError(err.response?.data?.detail || 'Failed to create');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg"
      >
        <h2 className="text-lg font-bold text-white mb-4">Create Instance</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <label className="block text-sm text-gray-400 mb-1">Data (JSON)</label>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 font-mono text-sm mb-4 focus:outline-none focus:border-blue-500 resize-none"
          rows={8}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Instances() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [thingName, setThingName] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/things/${id}/`)
      .then((res) => setThingName(res.data.name))
      .catch(() => {});
    api.get(`/instances/?thing=${id}`)
      .then((res) => setInstances(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-gray-400">Loading instances...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/admin')} className="text-sm text-blue-400 hover:text-blue-300 mb-2 block">
            &larr; Back to Things
          </button>
          <h1 className="text-2xl font-bold text-white">{thingName || 'Thing'} Instances</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 transition-colors"
        >
          + New Instance
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No instances yet</p>
          <p className="text-sm mt-1">Create your first instance of this Thing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {instances.map((instance) => (
            <div key={instance.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-hidden">
                {JSON.stringify(instance.data, null, 2)}
              </pre>
              <p className="text-xs text-gray-600 mt-2">
                Created: {new Date(instance.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateInstanceModal
          thingId={parseInt(id)}
          onClose={() => setShowCreate(false)}
          onCreated={(newInstance) => {
            setInstances([newInstance, ...instances]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
