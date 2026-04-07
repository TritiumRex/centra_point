import React, { useState } from 'react';

function TreeNode({ node, depth, activeId, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activeId === node.id;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
    if (node.url || node.sshHost || node.panel) {
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 py-1.5 text-sm text-left transition-colors rounded-md mx-1 ${
          isActive
            ? 'bg-blue-600 text-white font-medium'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' }}
      >
        {hasChildren && (
          <span className={`text-[10px] text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
        {!hasChildren && <span className="w-[10px]" />}
        <span className="text-sm">{node.icon}</span>
        <span className="truncate">{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeNav({ treeData, activeId, onSelect, collapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onToggleCollapse}
        />
      )}

      <aside
        className={`
          bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden z-30 transition-all duration-200
          ${collapsed ? 'w-0 md:w-0' : 'w-64 fixed inset-y-0 left-0 md:relative md:inset-auto'}
        `}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800 shrink-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</span>
          <button
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-300 md:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-1">
          {treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
