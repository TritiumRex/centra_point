import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateThingModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/things/', { name, slug, description, schema: { fields: [] } });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.slug?.[0] || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold text-white mb-4">Create Thing</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 mb-3 focus:outline-none focus:border-blue-500"
          placeholder="e.g. Projects"
          required
          autoFocus
        />
        <label className="block text-sm text-gray-400 mb-1">Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 mb-3 focus:outline-none focus:border-blue-500"
          placeholder="auto-generated"
          required
        />
        <label className="block text-sm text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 mb-4 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          placeholder="Optional description"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Things() {
  const navigate = useNavigate();
  const [things, setThings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchThings = () => {
    api.get('/things/')
      .then((res) => setThings(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchThings(); }, []);

  const handleDelete = async (id) => {
    if (deleting === id) {
      try {
        await api.delete(`/things/${id}/`);
        setThings(things.filter((t) => t.id !== id));
      } catch (err) {
        console.error(err);
      }
      setDeleting(null);
    } else {
      setDeleting(id);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading things...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Things</h1>
          <p className="text-sm text-gray-500 mt-1">Manage custom entity types</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 transition-colors"
        >
          + New Thing
        </button>
      </div>

      {things.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-3xl mb-3">+</p>
          <p className="text-lg">No things yet</p>
          <p className="text-sm mt-1">Create your first Thing to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {things.map((thing) => (
            <div
              key={thing.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium">{thing.name}</h3>
                  <span className="text-xs text-gray-600 font-mono">{thing.slug}</span>
                </div>
                {thing.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{thing.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => navigate(`/admin/things/${thing.id}/instances`)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Instances
                </button>
                <button
                  onClick={() => handleDelete(thing.id)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    deleting === thing.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-red-400 bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {deleting === thing.id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateThingModal
          onClose={() => setShowCreate(false)}
          onCreated={(newThing) => {
            setThings([newThing, ...things]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
