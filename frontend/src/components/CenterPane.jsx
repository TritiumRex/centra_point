import React from 'react';
import Terminal from './Terminal';

export default function CenterPane({ current, history, historyIndex, onBack, onForward, onClose }) {
  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  if (!current) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-4xl mb-4">&#9678;</p>
            <p className="text-lg">Select a service from the tree</p>
            <p className="text-sm text-gray-700 mt-1">Click any node with a URL to load it here</p>
            <p className="text-sm text-gray-700">Click a VM to open an SSH terminal</p>
          </div>
        </div>
      </div>
    );
  }

  // SSH terminal mode — node has sshHost set
  if (current.sshHost) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Terminal host={current.sshHost} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0">
        {/* Back / Forward */}
        <button
          onClick={onBack}
          disabled={!canBack}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            canBack
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          &larr;
        </button>
        <button
          onClick={onForward}
          disabled={!canForward}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            canForward
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          &rarr;
        </button>

        {/* Breadcrumb / info */}
        <span className="text-sm font-medium text-white ml-2">{current.icon} {current.label}</span>
        <span className="text-xs text-gray-500 truncate">{current.url}</span>

        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-gray-500 hover:text-blue-400 transition-colors shrink-0"
        >
          &#8599; New tab
        </a>
      </div>

      {/* iframe */}
      <iframe
        src={current.url}
        title={current.label}
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
