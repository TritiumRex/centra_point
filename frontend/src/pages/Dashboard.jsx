import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeNav from '../components/TreeNav';
import CenterPane from '../components/CenterPane';
import treeData from '../data/treeData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  const handleSelect = useCallback((node) => {
    if (!node.url && !node.sshHost && !node.panel) return;

    // If tab already exists for this node, focus it
    const existing = tabs.find(t => t.id === node.id);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    // Open new tab
    setTabs(prev => [...prev, node]);
    setActiveTabId(node.id);
  }, [tabs]);

  const handleCloseTab = useCallback((tabId) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      // If we closed the active tab, activate the last remaining tab
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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Top bar */}
      <header className="h-11 bg-gray-950 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          title={collapsed ? 'Show tree' : 'Hide tree'}
        >
          {collapsed ? '☰' : '◀'}
        </button>

        <h1 className="text-sm font-bold tracking-wide text-white">centra_point</h1>

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
      <footer className="h-8 bg-gray-950 border-t border-gray-800 flex items-center px-4 shrink-0 text-xs text-gray-600 gap-4">
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
