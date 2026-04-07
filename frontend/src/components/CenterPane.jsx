import React from 'react';
import Terminal from './Terminal';
import ProxmoxPanel from './ProxmoxPanel';
import TrueNASPanel from './TrueNASPanel';
import MailcowPanel from './MailcowPanel';
import DockerPanel from './DockerPanel';

const PANELS = {
  proxmox: ProxmoxPanel,
  truenas: TrueNASPanel,
  mailcow: MailcowPanel,
  docker: DockerPanel,
};

function TabContent({ node }) {
  if (node.sshHost) {
    return <Terminal host={node.sshHost} />;
  }

  const NativePanel = node.panel ? PANELS[node.panel] : null;
  if (NativePanel) {
    return <NativePanel node={node} />;
  }

  return (
    <iframe
      src={node.url}
      title={node.label}
      className="flex-1 w-full border-0 bg-white"
    />
  );
}

export default function CenterPane({ tabs, activeTabId }) {
  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-4xl mb-4">&#9678;</p>
            <p className="text-lg">Select a service from the tree</p>
            <p className="text-sm text-gray-700 mt-1">Click any node to open it in a tab</p>
            <p className="text-sm text-gray-700">SSH terminals stay alive when you switch tabs</p>
          </div>
        </div>
      </div>
    );
  }

  // SSH terminals stay mounted (hidden) to keep connections alive.
  // Everything else only renders when active.
  const sshTabs = tabs.filter(t => t.sshHost);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeIsSSH = activeTab?.sshHost;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* SSH terminals — always mounted, toggled with visibility */}
      {sshTabs.map(tab => (
        <div
          key={tab.id}
          className="absolute inset-0 flex flex-col"
          style={{
            visibility: tab.id === activeTabId ? 'visible' : 'hidden',
            zIndex: tab.id === activeTabId ? 1 : 0,
          }}
        >
          <TabContent node={tab} />
        </div>
      ))}

      {/* Non-SSH active tab — mounted only when active */}
      {activeTab && !activeIsSSH && (
        <div className="absolute inset-0 flex flex-col" style={{ zIndex: 1 }}>
          <TabContent node={activeTab} />
        </div>
      )}
    </div>
  );
}
