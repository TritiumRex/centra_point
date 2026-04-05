import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeNav from '../components/TreeNav';
import CenterPane from '../components/CenterPane';
import treeData from '../data/treeData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const current = historyIndex >= 0 ? history[historyIndex] : null;

  const handleSelect = useCallback((node) => {
    if (!node.url && !node.sshHost) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(node);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleCloseTerminal = useCallback(() => {
    setHistoryIndex(-1);
    setHistory([]);
  }, []);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  }, [historyIndex]);

  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  }, [historyIndex, history.length]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Top bar */}
      <header className="h-11 bg-gray-950 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
        {/* Hamburger for mobile / toggle tree */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          title={collapsed ? 'Show tree' : 'Hide tree'}
        >
          {collapsed ? '☰' : '◀'}
        </button>

        <h1 className="text-sm font-bold tracking-wide text-white">centra_point</h1>

        {/* Breadcrumb */}
        {current && (
          <span className="text-xs text-gray-500 truncate hidden sm:inline">
            / {current.label}
          </span>
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

      {/* Main content: tree + center pane */}
      <div className="flex flex-1 overflow-hidden">
        <TreeNav
          treeData={treeData}
          activeId={current?.id}
          onSelect={handleSelect}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <CenterPane
          current={current}
          history={history}
          historyIndex={historyIndex}
          onBack={handleBack}
          onForward={handleForward}
          onClose={handleCloseTerminal}
        />
      </div>

      {/* Footer */}
      <footer className="h-8 bg-gray-950 border-t border-gray-800 flex items-center px-4 shrink-0 text-xs text-gray-600 gap-4">
        <span>centra_point v1.0</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          {current ? `Viewing: ${current.label}` : 'No service selected'}
        </span>
        <span className="ml-auto hidden sm:inline">
          {history.length > 0 ? `${historyIndex + 1} / ${history.length} in history` : ''}
        </span>
      </footer>
    </div>
  );
}
