import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

const WS_URL = 'ws://localhost:8765';

export default function Terminal({ host, onClose }) {
  const termRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitRef = useRef(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    if (!termRef.current || !host) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#c9d1d9',
      },
      scrollback: 10000,
    });

    const fit = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(termRef.current);
    fit.fit();

    xtermRef.current = term;
    fitRef.current = fit;

    term.writeln(`\x1b[33mConnecting to ${host}...\x1b[0m`);

    // Connect WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send target host as first message
      ws.send(JSON.stringify({ host }));
    };

    ws.onmessage = (event) => {
      const data = event.data;
      // Check for JSON control messages
      if (data.startsWith('{')) {
        try {
          const msg = JSON.parse(data);
          if (msg.connected) {
            setStatus('connected');
            term.writeln(`\x1b[32mConnected to ${msg.host}\x1b[0m\r\n`);
            // Send initial resize
            ws.send(JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows,
            }));
            return;
          }
          if (msg.error) {
            setStatus('error');
            term.writeln(`\x1b[31mError: ${msg.error}\x1b[0m`);
            return;
          }
        } catch (e) {
          // Not JSON, treat as terminal data
        }
      }
      term.write(data);
    };

    ws.onclose = () => {
      setStatus('disconnected');
      term.writeln('\r\n\x1b[31mConnection closed.\x1b[0m');
    };

    ws.onerror = () => {
      setStatus('error');
      term.writeln('\r\n\x1b[31mWebSocket error.\x1b[0m');
    };

    // Send keystrokes to SSH
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }));
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [host]);

  const statusColors = {
    connecting: 'text-yellow-500',
    connected: 'text-green-500',
    disconnected: 'text-gray-500',
    error: 'text-red-500',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* Terminal bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0">
        <span className={`text-xs font-bold ${statusColors[status]}`}>
          {status === 'connected' ? '●' : status === 'connecting' ? '◌' : '○'}
        </span>
        <span className="text-sm font-medium text-white">SSH: frank@{host}</span>
        <span className="text-xs text-gray-500">{status}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Close
          </button>
        )}
      </div>
      {/* Terminal canvas */}
      <div ref={termRef} className="flex-1 p-1" />
    </div>
  );
}
