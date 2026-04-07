import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeNav from '../components/TreeNav';
import CenterPane from '../components/CenterPane';
import api from '../services/api';

// Convert API menu nodes to the format the tree/center pane expects
function apiToTreeNode(apiNode) {
  const node = {
    id: `menu-${apiNode.id}`,
    label: apiNode.label,
    icon: apiNode.icon || '',
  };

  if (apiNode.node_type === 'ssh' && apiNode.ssh_host) {
    node.sshHost = apiNode.ssh_host;
  } else if (apiNode.node_type === 'panel' && apiNode.panel_type) {
    node.panel = apiNode.panel_type;
    if (apiNode.url) node.url = apiNode.url;
  } else if (apiNode.node_type === 'iframe' && apiNode.url) {
    node.url = apiNode.url;
  }

  if (apiNode.children && apiNode.children.length > 0) {
    node.children = apiNode.children.map(apiToTreeNode);
  }

  return node;
}

function findBreadcrumb(nodes, targetId, path = []) {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === targetId) return currentPath;
    if (node.children) {
      const found = findBreadcrumb(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

// Find the nearest group ancestor (or self) to show sub-nav for
function findGroupParent(nodes, targetId) {
  const crumbs = findBreadcrumb(nodes, targetId);
  if (!crumbs) return null;
  // Walk backwards to find the closest group with children
  for (let i = crumbs.length - 1; i >= 0; i--) {
    const n = crumbs[i];
    if (n.children && n.children.length > 0) {
      // Return the group's leaf children (skipping sub-groups)
      return n;
    }
  }
  return null;
}

function getLeafChildren(node) {
  const leaves = [];
  if (!node.children) return leaves;
  for (const child of node.children) {
    if (child.children && child.children.length > 0) {
      leaves.push(...getLeafChildren(child));
    } else if (child.url || child.sshHost || child.panel) {
      leaves.push(child);
    }
  }
  return leaves;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);

  // Load menu from API
  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    api.get('/menu/tree/', { headers })
      .then(res => {
        const data = (res.data || []).map(apiToTreeNode);
        setTreeData(data);
      })
      .catch(err => {
        console.error('Failed to load menu:', err);
        setTreeData([]);
      })
      .finally(() => setTreeLoading(false));
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  const breadcrumb = useMemo(() => {
    if (!activeTabId) return [];
    return findBreadcrumb(treeData, activeTabId) || [];
  }, [activeTabId, treeData]);

  // Sub-navigation: find the group parent of the active tab
  const subNavGroup = useMemo(() => {
    if (!activeTabId) return null;
    return findGroupParent(treeData, activeTabId);
  }, [activeTabId, treeData]);

  const subNavItems = useMemo(() => {
    if (!subNavGroup) return [];
    return getLeafChildren(subNavGroup);
  }, [subNavGroup]);

  const handleSelect = useCallback((node) => {
    // If it's a group with children, open the first leaf child
    if (node.children && node.children.length > 0) {
      const leaves = getLeafChildren(node);
      if (leaves.length > 0) {
        // Open the first leaf
        const leaf = leaves[0];
        const existing = tabs.find(t => t.id === leaf.id);
        if (existing) {
          setActiveTabId(existing.id);
          return;
        }
        setTabs(prev => [...prev, leaf]);
        setActiveTabId(leaf.id);
        return;
      }
      return; // Group with no actionable children
    }

    if (!node.url && !node.sshHost && !node.panel) return;

    const existing = tabs.find(t => t.id === node.id);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    setTabs(prev => [...prev, node]);
    setActiveTabId(node.id);
  }, [tabs]);

  const handleCloseTab = useCallback((tabId) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeTabId]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  if (treeLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-500">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-3" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Top bar */}
      <header className="h-11 bg-gray-950 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          title={collapsed ? 'Show tree' : 'Hide tree'}
        >
          {collapsed ? '\u2630' : '\u25c0'}
        </button>

        <h1 className="text-sm font-bold tracking-wide text-white">centra_point</h1>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 truncate hidden sm:flex">
            {breadcrumb.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-700">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-gray-300' : ''}>
                  {node.label}
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
          >
            Admin
          </button>
          <span className="text-xs text-gray-500 hidden sm:inline">frank@tibernium.com</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sub-navigation bar — shows sibling services when inside a group */}
      {subNavItems.length > 1 && (
        <div className="flex items-center bg-gray-850 border-b border-gray-700 px-2 py-1 shrink-0 overflow-x-auto gap-1"
             style={{ backgroundColor: '#151a26' }}>
          <span className="text-xs text-gray-600 mr-2 shrink-0">
            {subNavGroup?.icon} {subNavGroup?.label}:
          </span>
          {subNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`px-2.5 py-1 text-xs rounded shrink-0 transition-colors ${
                item.id === activeTabId
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab bar */}
      {tabs.length > 0 && (
        <div className="flex items-center bg-gray-850 border-b border-gray-700 overflow-x-auto shrink-0"
             style={{ backgroundColor: '#1a1f2e' }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-gray-700 shrink-0 max-w-[180px] transition-colors ${
                tab.id === activeTabId
                  ? 'bg-gray-800 text-white border-b-2 border-b-blue-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="truncate">{tab.icon} {tab.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all ml-1 shrink-0"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main content: tree + center pane */}
      <div className="flex flex-1 overflow-hidden">
        <TreeNav
          treeData={treeData}
          activeId={activeTabId}
          onSelect={handleSelect}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <CenterPane
          tabs={tabs}
          activeTabId={activeTabId}
        />
      </div>

      {/* Footer */}
      <footer className="h-8 bg-gray-950 border-t border-gray-800 flex items-center px-4 shrink-0 text-xs text-gray-400 gap-4">
        <span>centra_point v1.0</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          {activeTab ? `Viewing: ${activeTab.label}` : 'No service selected'}
        </span>
        <span className="ml-auto hidden sm:inline">
          {tabs.length > 0 ? `${tabs.length} tab${tabs.length !== 1 ? 's' : ''} open` : ''}
        </span>
      </footer>
    </div>
  );
}
