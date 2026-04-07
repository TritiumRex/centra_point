import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NODE_TYPES = [
  { value: 'group', label: 'Group (folder)' },
  { value: 'iframe', label: 'Iframe (web UI)' },
  { value: 'panel', label: 'Native Panel' },
  { value: 'ssh', label: 'SSH Terminal' },
];

const PANEL_TYPES = [
  { value: '', label: '-- None --' },
  { value: 'proxmox', label: 'Proxmox' },
  { value: 'truenas', label: 'TrueNAS' },
  { value: 'mailcow', label: 'Mailcow' },
  { value: 'docker', label: 'Docker' },
];

const inputClass = 'w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500';
const btnClass = 'px-3 py-1.5 text-xs rounded font-medium transition-colors';

function NodeForm({ node, allNodes, onSave, onCancel }) {
  const [form, setForm] = useState({
    label: '', icon: '', node_type: 'iframe', url: '',
    ssh_host: '', panel_type: '', parent: null, sort_order: 0, is_active: true,
    ...node,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.parent === '') data.parent = null;
    if (data.ssh_host === '') data.ssh_host = null;
    onSave(data);
  };

  // Build parent options (exclude self and descendants)
  const parentOptions = allNodes.filter(n => !node || n.id !== node.id);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-5 mb-4">
      <h3 className="text-sm font-bold text-white mb-4">
        {node?.id ? 'Edit Node' : 'Add Node'}
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Label</label>
          <input className={inputClass} value={form.label} onChange={e => set('label', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Icon (emoji)</label>
          <input className={inputClass} value={form.icon} onChange={e => set('icon', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Type</label>
          <select className={inputClass} value={form.node_type} onChange={e => set('node_type', e.target.value)}>
            {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Parent</label>
          <select className={inputClass} value={form.parent || ''} onChange={e => set('parent', e.target.value || null)}>
            <option value="">-- Root (top level) --</option>
            {parentOptions.map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
      </div>

      {form.node_type === 'iframe' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">URL</label>
          <input className={inputClass} value={form.url} onChange={e => set('url', e.target.value)} placeholder="http://..." />
        </div>
      )}

      {form.node_type === 'ssh' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">SSH Host (IP)</label>
          <input className={inputClass} value={form.ssh_host || ''} onChange={e => set('ssh_host', e.target.value)} placeholder="192.168.1.x" />
        </div>
      )}

      {form.node_type === 'panel' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Panel Type</label>
            <select className={inputClass} value={form.panel_type} onChange={e => set('panel_type', e.target.value)}>
              {PANEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">URL (optional fallback)</label>
            <input className={inputClass} value={form.url} onChange={e => set('url', e.target.value)} placeholder="http://..." />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
          <input type="number" className={inputClass} value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
            Active
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}>
          {node?.id ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className={`${btnClass} bg-gray-700 text-gray-300 hover:bg-gray-600`}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function NodeRow({ node, depth, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
      <td className="py-2 px-3">
        <div style={{ paddingLeft: `${depth * 20}px` }} className="flex items-center gap-2">
          <span>{node.icon}</span>
          <span className="text-sm text-gray-200">{node.label}</span>
        </div>
      </td>
      <td className="py-2 px-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          node.node_type === 'group' ? 'bg-purple-900/50 text-purple-300' :
          node.node_type === 'iframe' ? 'bg-blue-900/50 text-blue-300' :
          node.node_type === 'panel' ? 'bg-green-900/50 text-green-300' :
          'bg-yellow-900/50 text-yellow-300'
        }`}>
          {node.node_type}
        </span>
      </td>
      <td className="py-2 px-3 text-xs text-gray-500 font-mono truncate max-w-[200px]">
        {node.url || node.ssh_host || node.panel_type || '-'}
      </td>
      <td className="py-2 px-3 text-xs text-gray-500">{node.sort_order}</td>
      <td className="py-2 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onEdit(node)} className={`${btnClass} bg-gray-700 text-gray-300 hover:bg-gray-600`}>
            Edit
          </button>
          <button onClick={() => onDelete(node)} className={`${btnClass} bg-red-900/50 text-red-300 hover:bg-red-800/50`}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function flattenTree(nodes, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export default function MenuAdmin() {
  const [tree, setTree] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [editing, setEditing] = useState(null); // null = hidden, {} = new, {id:...} = editing
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const fetchMenu = useCallback(async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/menu/tree/', { headers }),
        api.get('/menu/nodes/?format=flat', { headers }),
      ]);
      setTree(treeRes.data || []);
      setAllNodes(flatRes.data || []);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/menu/nodes/${data.id}/`, data, { headers });
      } else {
        await api.post('/menu/nodes/', data, { headers });
      }
      setEditing(null);
      fetchMenu();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDelete = async (node) => {
    if (!window.confirm(`Delete "${node.label}" and all its children?`)) return;
    try {
      await api.delete(`/menu/nodes/${node.id}/`, { headers });
      fetchMenu();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const flatNodes = flattenTree(tree);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading menu...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Menu Editor</h2>
        <button
          onClick={() => setEditing({})}
          className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
        >
          + Add Node
        </button>
      </div>

      {editing !== null && (
        <NodeForm
          node={editing}
          allNodes={allNodes}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-700">
              <th className="text-left py-2 px-3 font-medium">Label</th>
              <th className="text-left py-2 px-3 font-medium">Type</th>
              <th className="text-left py-2 px-3 font-medium">Target</th>
              <th className="text-left py-2 px-3 font-medium">Order</th>
              <th className="text-right py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flatNodes.map(node => (
              <NodeRow
                key={node.id}
                node={node}
                depth={node._depth}
                onEdit={(n) => setEditing(n)}
                onDelete={handleDelete}
              />
            ))}
            {flatNodes.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-600 py-8">
                  No menu items. Click "+ Add Node" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
